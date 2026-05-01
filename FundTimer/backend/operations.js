import { db } from "./firebase.js";
import { ref, get, query, limitToLast, update, child, set, serverTimestamp, orderByKey, orderByChild}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import  {pn, ino, pq, up, sf, sa, estv} from "../public/js/getValues.js";

async function addData(
    itemName,
    itemQuan,
    itemPriceCurr,
    itemUnitPrice,
    userSavingsFreq,
    userSavingsCurr,
    userSavingsAmount){

    const productsRef = ref(db, 'products');
    const snapshot = await get(productsRef);
    const count = snapshot.exists() ? snapshot.size + 1 : 1;

    const dataset = {
        item_no : count,
        item_name : itemName,
        item_quantity :  itemQuan,
        item_price_currency : itemPriceCurr,
        item_unit_price : itemUnitPrice,
        user_savings_frequency : userSavingsFreq,
        user_savings_currency : userSavingsCurr,
        user_savings_amount: userSavingsAmount,
        createdAt: serverTimestamp()
    }
    const newProductRef = ref(db, `products/${itemName}`);
    await set(newProductRef, dataset);
    return dataset;
}

async function CalculateETP(itemName, itemQuan, itemPriceCurr, itemUnitPrice, userSavingsFreq, userSavingsCurr, userSavingsAmount){
    let finalEstimatedTimePurchase;
    const convertion_rates = {
        "php" : {
            "usd": 0.02,
            "eur": 0.01,
            "cny": 0.11,
            "jpy": 2.65,
            "gbp": 0.01
        },

        "usd" : {
            "php": 60.03,
            "eur": 0.85,
            "cny": 6.82,
            "jpy": 158.99,
            "gbp": 0.74
        },

        "eur" : {
            "php": 70.74,
            "usd": 1.18,
            "cny": 8.03,
            "jpy": 187.36,
            "gbp": 0.87
        },

        "cny": {
            "php": 8.81,
            "usd": 0.15,
            "eur": 0.12,
            "jpy": 23.32,
            "gbp": 0.11
        },

        "jpy": {
            "php": 0.38,
            "usd": 0.01,
            "eur": 0.01,
            "cny": 0.04,
            "gbp": 0.00
        },

        "gbp": {
            "php": 81.42,
            "usd": 1.36,
            "eur": 1.15,
            "cny": 9.25,
            "jpy": 215.63
        }
    }

    let statusMessage;
    let rMoneyNeeded;
    const conversionRate = itemPriceCurr == userSavingsCurr ? 1 : convertion_rates[itemPriceCurr][userSavingsCurr];
    const totalPrice = (itemQuan * itemUnitPrice) * conversionRate;

    if (userSavingsAmount <= 0) {
        statusMessage = "Enter a savings amount greater than zero.";
        finalEstimatedTimePurchase = 0;
        rMoneyNeeded = Math.trunc(totalPrice);
    }
    else if (userSavingsAmount == totalPrice) {
        statusMessage = `Your current savings is just enough to buy the ${itemName}`;
        finalEstimatedTimePurchase = 0;
        rMoneyNeeded = 0;
    }
    else if (userSavingsAmount > totalPrice) {
        statusMessage = `Your current savings is more than enough for the ${itemName} you want to buy`;
        finalEstimatedTimePurchase = 0;
        rMoneyNeeded = 0;
    }
    else {
        finalEstimatedTimePurchase = Math.trunc(totalPrice / userSavingsAmount);
        rMoneyNeeded = Math.trunc(totalPrice - (finalEstimatedTimePurchase * userSavingsAmount));
    }

    const itemRef = ref(db, `products/${itemName}`);
    await update(itemRef, {
        estimated_time_purchase: finalEstimatedTimePurchase,
        remaining_money_needed: rMoneyNeeded
    });

    return statusMessage;
}


async function getData(){

    const q = query(ref(db, 'products'), orderByChild('createdAt'), limitToLast(1));
    const snapshot = await get(q);

    let data = null;

    if (!snapshot.exists()) {
        return null;
    }
    snapshot.forEach(child => {
        const lastKey = child.val();
        data = {
            ino: lastKey.item_no,
            iname: lastKey.item_name,
            uprice: lastKey.item_unit_price,
            icurr: lastKey.item_price_currency,
            iquant: lastKey.item_quantity,
            usavfreq: lastKey.user_savings_frequency,
            usavcurr: lastKey.user_savings_currency,
            usersavamount: lastKey.user_savings_amount,
            est: lastKey.estimated_time_purchase,
            rmn: lastKey.remaining_money_needed
        }
    })
    return data;
}

const currencySymbols = {
    php: "\u20b1",
    usd: "$",
    eur: "\u20ac",
    cny: "\u00a5",
    jpy: "\u00a5",
    gbp: "\u00a3"
};

const savfeqlabels = {
    daily: "days",
    weekly: "weeks",
    monthly: "months",
    yearly: "years"
}

function fillHTMLResCon(prodname, prodnumber, prodquan, unitprice, usavfreque, usersaveam, est, rmn, itemcurr, savcurr){
    pn.textContent= prodname;
    pq.textContent = prodquan;
    up.textContent = `${currencySymbols[itemcurr]}${unitprice}`
    sf.textContent = usavfreque
    sa.textContent = `${currencySymbols[savcurr]}${usersaveam}`

    const estm1 = `${est} ${savfeqlabels[usavfreque]}.`
    const estm2 = `${est} ${savfeqlabels[usavfreque]} and extra ${currencySymbols[savcurr]}${rmn} needed.`

    if (rmn == 0) {
        estv.textContent = estm1
    }
    else {
        estv.textContent = estm2
    }
}

async function loadData() {
    const data = await getData();
    if (!data) {
        console.log("No data found in the database.");
        return;
    }
    fillHTMLResCon(
        data.iname,
        data.ino,
        data.iquant,
        data.uprice,
        data.usavfreq,
        data.usersavamount,
        data.est,
        data.rmn,
        data.icurr,
        data.usavcurr
    );
}


export {addData, CalculateETP, loadData}
