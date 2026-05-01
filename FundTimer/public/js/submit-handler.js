// submit-handler.js
import { addData, CalculateETP, loadData } from "../../backend/operations.js";
import { itemName, itemQuan, itemPriceCurr, itemUnitPrice, userSavingsFreq, userSavingsCurr, userSavingsAmount, resBox } from "./getValues.js";

const submitBtn = document.getElementById('submitbttn');
const seeCalcBtn = document.getElementById('seeCalc');
const calcBreakdown = document.getElementById('calcBreakdown');
const calcToggleIcon = document.getElementById('calcToggleIcon');
const calcToggleText = document.getElementById('calcToggleText');
const calcGoal = document.getElementById('calcGoal');
const calcGoalFormula = document.getElementById('calcGoalFormula');
const calcConversion = document.getElementById('calcConversion');
const calcConversionFormula = document.getElementById('calcConversionFormula');
const calcSavings = document.getElementById('calcSavings');
const calcSavingsFormula = document.getElementById('calcSavingsFormula');
const calcTimeline = document.getElementById('calcTimeline');
const calcTimelineFormula = document.getElementById('calcTimelineFormula');

const conversionRates = {
    php: {
        usd: 0.02,
        eur: 0.01,
        cny: 0.11,
        jpy: 2.65,
        gbp: 0.01
    },
    usd: {
        php: 60.03,
        eur: 0.85,
        cny: 6.82,
        jpy: 158.99,
        gbp: 0.74
    },
    eur: {
        php: 70.74,
        usd: 1.18,
        cny: 8.03,
        jpy: 187.36,
        gbp: 0.87
    },
    cny: {
        php: 8.81,
        usd: 0.15,
        eur: 0.12,
        jpy: 23.32,
        gbp: 0.11
    },
    jpy: {
        php: 0.38,
        usd: 0.01,
        eur: 0.01,
        cny: 0.04,
        gbp: 0.00
    },
    gbp: {
        php: 81.42,
        usd: 1.36,
        eur: 1.15,
        cny: 9.25,
        jpy: 215.63
    }
};

const currencyCodes = {
    php: "PHP",
    usd: "USD",
    eur: "EUR",
    cny: "CNY",
    jpy: "JPY",
    gbp: "GBP"
};

const savingsLabels = {
    Daily: "days",
    Weekly: "weeks",
    Monthly: "months",
    Yearly: "years"
};

let latestBreakdown = null;

function formatCurrency(amount, currency) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCodes[currency],
        maximumFractionDigits: 2
    }).format(Number.isFinite(amount) ? amount : 0);
}

function formatNumber(amount) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2
    }).format(Number.isFinite(amount) ? amount : 0);
}

function buildCalculationBreakdown(quantity, itemCurrency, unitPrice, savingsFrequency, savingsCurrency, savingsAmount) {
    const rate = itemCurrency === savingsCurrency ? 1 : conversionRates[itemCurrency][savingsCurrency];
    const itemTotal = quantity * unitPrice;
    const convertedTotal = itemTotal * rate;
    const fullPeriods = savingsAmount >= convertedTotal ? 0 : Math.trunc(convertedTotal / savingsAmount);
    const remainingAmount = Math.max(0, Math.trunc(convertedTotal - (fullPeriods * savingsAmount)));
    const rawPeriods = savingsAmount > 0 ? convertedTotal / savingsAmount : 0;

    return {
        quantity,
        itemCurrency,
        unitPrice,
        savingsFrequency,
        savingsCurrency,
        savingsAmount,
        rate,
        itemTotal,
        convertedTotal,
        fullPeriods,
        remainingAmount,
        rawPeriods
    };
}

function resetCalculationPanel() {
    calcBreakdown.hidden = true;
    seeCalcBtn.setAttribute("aria-expanded", "false");
    calcToggleIcon.textContent = "calculate";
    calcToggleText.textContent = "See calculations";
}

function populateCalculationBreakdown(breakdown) {
    const itemCurrencyCode = currencyCodes[breakdown.itemCurrency];
    const savingsCurrencyCode = currencyCodes[breakdown.savingsCurrency];
    const periodLabel = savingsLabels[breakdown.savingsFrequency];
    const displayPeriodLabel = breakdown.fullPeriods === 1 ? periodLabel.slice(0, -1) : periodLabel;
    const sameCurrency = breakdown.itemCurrency === breakdown.savingsCurrency;
    const hasRemaining = breakdown.remainingAmount > 0;

    calcGoal.textContent = formatCurrency(breakdown.itemTotal, breakdown.itemCurrency);
    calcGoalFormula.textContent = `${breakdown.quantity} x ${formatCurrency(breakdown.unitPrice, breakdown.itemCurrency)} = ${formatCurrency(breakdown.itemTotal, breakdown.itemCurrency)}.`;

    if (sameCurrency) {
        calcConversion.textContent = "No conversion needed";
        calcConversionFormula.textContent = `Product price and savings are both in ${itemCurrencyCode}.`;
    } else {
        calcConversion.textContent = formatCurrency(breakdown.convertedTotal, breakdown.savingsCurrency);
        calcConversionFormula.textContent = `${formatCurrency(breakdown.itemTotal, breakdown.itemCurrency)} x ${formatNumber(breakdown.rate)} = ${formatCurrency(breakdown.convertedTotal, breakdown.savingsCurrency)}. Rate used: 1 ${itemCurrencyCode} = ${formatNumber(breakdown.rate)} ${savingsCurrencyCode}.`;
    }

    calcSavings.textContent = `${formatCurrency(breakdown.savingsAmount, breakdown.savingsCurrency)} ${breakdown.savingsFrequency}`;
    calcSavingsFormula.textContent = `Each ${breakdown.savingsFrequency} contribution is subtracted from the goal total in ${savingsCurrencyCode}.`;

    calcTimeline.textContent = hasRemaining
        ? `${breakdown.fullPeriods} ${displayPeriodLabel} + ${formatCurrency(breakdown.remainingAmount, breakdown.savingsCurrency)}`
        : `${breakdown.fullPeriods} ${displayPeriodLabel}`;

    calcTimelineFormula.textContent = `${formatCurrency(breakdown.convertedTotal, breakdown.savingsCurrency)} / ${formatCurrency(breakdown.savingsAmount, breakdown.savingsCurrency)} = ${formatNumber(breakdown.rawPeriods)} periods. FundTimer shows ${breakdown.fullPeriods} full ${displayPeriodLabel}${hasRemaining ? `, then ${formatCurrency(breakdown.remainingAmount, breakdown.savingsCurrency)} extra needed.` : "."}`;
}

seeCalcBtn.addEventListener('click', () => {
    if (!latestBreakdown) {
        return;
    }

    const shouldOpen = calcBreakdown.hidden;
    calcBreakdown.hidden = !shouldOpen;
    seeCalcBtn.setAttribute("aria-expanded", String(shouldOpen));
    calcToggleIcon.textContent = shouldOpen ? "visibility_off" : "calculate";
    calcToggleText.textContent = shouldOpen ? "Hide calculations" : "See calculations";
});

submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const nameValue = itemName.value;

    if (!nameValue) {
        alert("Please enter a product name first!");
        return;
    }

    const quanValue = Number(itemQuan.value);
    const priceCurrValue = itemPriceCurr.value;
    const unitPriceValue = Number(itemUnitPrice.value);
    const savFreqValue = userSavingsFreq.value;
    const savCurrValue = userSavingsCurr.value;
    const savAmountValue = Number(userSavingsAmount.value);

    if (quanValue <= 0 || unitPriceValue <= 0 || savAmountValue <= 0) {
        alert("Please enter a quantity, unit price, and savings amount greater than zero.");
        return;
    }

    latestBreakdown = buildCalculationBreakdown(quanValue, priceCurrValue, unitPriceValue, savFreqValue, savCurrValue, savAmountValue);
    populateCalculationBreakdown(latestBreakdown);
    resetCalculationPanel();

    await addData(nameValue, quanValue, priceCurrValue, unitPriceValue, savFreqValue, savCurrValue, savAmountValue);
    await CalculateETP(nameValue, quanValue, priceCurrValue, unitPriceValue, savFreqValue, savCurrValue, savAmountValue);
    await loadData();

    // Show the result box with the layout defined in CSS.
    resBox.style.display = 'grid';
    // ... after loadData() ...
    const scrollContainer = document.getElementById("resultbox");

    // 1. Reset scroll position to top first
    let windowAutoScroll = setInterval(() => {
        // Get the position of the box relative to the viewport
        const rect = scrollContainer.getBoundingClientRect();

        // If the top of the box is already in view (e.g., 100px from top), stop
        if (rect.top <= 150) {
            clearInterval(windowAutoScroll);
        } else {
            window.scrollBy(0, 10); // Scroll the whole page down by 5px
        }
    }, 16); // 60fps

    // Stop if the user interacts
    const stopWindowScroll = () => clearInterval(windowAutoScroll);
    window.addEventListener('wheel', stopWindowScroll, { once: true });
    window.addEventListener('touchstart', stopWindowScroll, { once: true });// A 100ms delay is usually enough for the browser to render the new list

    itemName.value = "";
    itemQuan.value = "";
    itemUnitPrice.value = "";
    userSavingsAmount.value = "";

    itemPriceCurr.selectedIndex = 0;
    userSavingsFreq.selectedIndex = 0;
    userSavingsCurr.selectedIndex = 0;
});
