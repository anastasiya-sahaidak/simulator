let supply = [], demand = [], cost = [], correct = [];

let attempts = {};
let costAttempts = 0;

let currentSupply = [];
let currentDemand = [];

let blockedRows = [];
let blockedCols = [];
let fakeSupplier = false;
let fakeConsumer = false;

function showMessage(text, type = "info") { //повідомлення

    let msg = document.getElementById("message");

    msg.innerText = text;

    msg.className = "";

    msg.classList.add(`msg-${type}`);

    msg.style.display = "block";

    setTimeout(() => {
        msg.style.display = "none";
    }, 3000);
}

function generateTask() { //генерація

    let r = +rows.value;
    let c = +cols.value;

    fakeSupplier = false;
    fakeConsumer = false;

    supply = Array.from( //запаси
        { length: r },
        () => Math.floor(Math.random() * 20 + 5)
    );

    let totalSupply = //сума
        supply.reduce((a, b) => a + b, 0);

    demand = []; //потреби

    let remain = totalSupply;

    for (let j = 0; j < c - 1; j++) {

        let max =
            Math.max(
                1,
                Math.floor(remain / (c - j))
            );

        let value =
            Math.floor(Math.random() * max) + 1;

        if (value > remain) {

            value = remain;
        }

        demand.push(value);

        remain -= value;
    }

    if (remain < 0) {

        remain = 0;
    }

    demand.push(remain);

    cost = Array.from( //тарифи
        { length: r },
        () => Array.from(
            { length: c },
            () => Math.floor(Math.random() * 20 + 1)
        )
    );

    solve();

    initDynamicData();

    renderTask();

    clearInfo();
}

function initDynamicData() { //ініціалізація

    currentSupply = [...supply];
    currentDemand = [...demand];

    blockedRows =
        Array(supply.length).fill(false);

    blockedCols =
        Array(demand.length).fill(false);
}

function enableCustom() { //ручний ввід

    let r = +rows.value;
    let c = +cols.value;

    let html = "<table>";

    html += "<tr><th></th>";

    for (let j = 0; j < c; j++) {

        html += `<th>P${j + 1}</th>`;
    }

    html += "<th>Запас</th></tr>";

    for (let i = 0; i < r; i++) {

        html += `<tr><th>C${i + 1}</th>`;

        for (let j = 0; j < c; j++) {

            html += `
            <td>
                <input id="cost-${i}-${j}" type="number">
            </td>`;
        }

        html += `
        <td>
            <input id="supply-${i}" type="number">
        </td>`;

        html += "</tr>";
    }

    html += "<tr><th>Потреби</th>";

    for (let j = 0; j < c; j++) {

        html += `
        <td>
            <input id="demand-${j}" type="number">
        </td>`;
    }

    html += "</tr></table>";

    html += `
    <br>
    <button class="btn" onclick="applyCustom()">
        Застосувати
    </button>`;

    document.getElementById("task").innerHTML = html;
}

function applyCustom() { //застосування

    try {

        let r = +rows.value;
        let c = +cols.value;

        cost = [];
        supply = [];
        demand = [];

        fakeSupplier = false;
        fakeConsumer = false;

        for (let i = 0; i < r; i++) {

            cost[i] = [];

            for (let j = 0; j < c; j++) {

                cost[i][j] =
                    +document.getElementById(`cost-${i}-${j}`).value || 0;
            }
        }

        for (let i = 0; i < r; i++) {

            supply[i] =
                +document.getElementById(`supply-${i}`).value || 0;
        }

        for (let j = 0; j < c; j++) {

            demand[j] =
                +document.getElementById(`demand-${j}`).value || 0;
        }

        balance();

        solve();

        initDynamicData();

        renderTask();

        clearInfo();

        showMessage(
            "Дані введено вручну ✅",
            "success"
        );

    } catch (e) {

        console.error(e);

        showMessage(
            "Помилка введення",
            "error"
        );
    }
}

function balance() { //баланс

    fakeSupplier = false;
    fakeConsumer = false;

    let sumS =
        supply.reduce((a, b) => a + b, 0);

    let sumD =
        demand.reduce((a, b) => a + b, 0);

    if (sumS > sumD) { //фіктивний споживач

        fakeConsumer = true;

        demand.push(sumS - sumD);

        cost.forEach(r => r.push(0));
    }

    else if (sumD > sumS) { //фіктивний постачальник

        fakeSupplier = true;

        supply.push(sumD - sumS);

        cost.push(
            Array(demand.length).fill(0)
        );
    }
}

function solve() { //вибір методу 

    let m = method.value;

    if (m === "nw") {

        correct = northWest();

    } else if (m === "min") {

        correct = minCost();

    } else if (m === "double") {

        correct = doublePreference();

    } else if (m === "vogel") {

        correct = vogel();
    }
}

function northWest() { //північно-західний кут

    let s = [...supply];
    let d = [...demand];

    let res = Array.from(
        { length: s.length },
        () => Array(d.length).fill(0)
    );

    let i = 0;
    let j = 0;

    while (i < s.length && j < d.length) {

        let x = Math.min(s[i], d[j]);

        res[i][j] = x;

        s[i] -= x;
        d[j] -= x;

        if (s[i] === 0) {

            i++;

        } else {

            j++;
        }
    }

    return res;
}

function minCost() { //мінімальний тариф

    let s = [...supply];
    let d = [...demand];

    let res = Array.from(
        { length: s.length },
        () => Array(d.length).fill(0)
    );

    while (true) {

        let min = Infinity;
        let mi = -1;
        let mj = -1;

        for (let i = 0; i < s.length; i++) {

            for (let j = 0; j < d.length; j++) {

                if (
                    s[i] > 0 &&
                    d[j] > 0 &&
                    cost[i][j] < min
                ) {

                    min = cost[i][j];

                    mi = i;
                    mj = j;
                }
            }
        }

        if (mi === -1) break;

        let x = Math.min(s[mi], d[mj]);

        res[mi][mj] = x;

        s[mi] -= x;
        d[mj] -= x;
    }

    return res;
}

function vogel() { //апрксимація Фогеля

    let s = [...supply];
    let d = [...demand];

    let res = Array.from(
        { length: s.length },
        () => Array(d.length).fill(0)
    );

    let activeRows =
        Array(s.length).fill(true);

    let activeCols =
        Array(d.length).fill(true);

    while (true) {

        let penalties = [];

        for (let i = 0; i < s.length; i++) {

            if (!activeRows[i]) continue;

            let arr = [];

            for (let j = 0; j < d.length; j++) {

                if (activeCols[j]) {

                    arr.push(cost[i][j]);
                }
            }

            if (arr.length < 2) continue;

            arr.sort((a, b) => a - b);

            penalties.push({
                type: "row",
                index: i,
                value: arr[1] - arr[0]
            });
        }

        for (let j = 0; j < d.length; j++) {

            if (!activeCols[j]) continue;

            let arr = [];

            for (let i = 0; i < s.length; i++) {

                if (activeRows[i]) {

                    arr.push(cost[i][j]);
                }
            }

            if (arr.length < 2) continue;

            arr.sort((a, b) => a - b);

            penalties.push({
                type: "col",
                index: j,
                value: arr[1] - arr[0]
            });
        }

        if (!penalties.length) {

            for (let i = 0; i < s.length; i++) {

                for (let j = 0; j < d.length; j++) {

                    if (
                        activeRows[i] &&
                        activeCols[j]
                    ) {

                        let x = Math.min(s[i], d[j]);

                        res[i][j] = x;

                        s[i] -= x;
                        d[j] -= x;
                    }
                }
            }

            break;
        }

        penalties.sort((a, b) => b.value - a.value);

        let best = penalties[0];

        let mi = -1;
        let mj = -1;

        if (best.type === "row") {

            mi = best.index;

            let min = Infinity;

            for (let j = 0; j < d.length; j++) {

                if (
                    activeCols[j] &&
                    cost[mi][j] < min
                ) {

                    min = cost[mi][j];

                    mj = j;
                }
            }

        } else {

            mj = best.index;

            let min = Infinity;

            for (let i = 0; i < s.length; i++) {

                if (
                    activeRows[i] &&
                    cost[i][mj] < min
                ) {

                    min = cost[i][mj];

                    mi = i;
                }
            }
        }

        let x = Math.min(s[mi], d[mj]);

        res[mi][mj] = x;

        s[mi] -= x;
        d[mj] -= x;

        if (s[mi] === 0) {

            activeRows[mi] = false;
        }

        if (d[mj] === 0) {

            activeCols[mj] = false;
        }
    }

    return res;
}

function doublePreference() { //метод подвійної переваги

    let s = [...supply];
    let d = [...demand];

    let res = Array.from(
        { length: s.length },
        () => Array(d.length).fill(0)
    );

    let activeRows =
        Array(s.length).fill(true);

    let activeCols =
        Array(d.length).fill(true);

    while (true) {

        let found = false;

        for (let i = 0; i < s.length; i++) {

            if (!activeRows[i]) continue;

            let rowMin = Infinity;

            for (let j = 0; j < d.length; j++) {

                if (
                    activeCols[j] &&
                    cost[i][j] < rowMin
                ) {

                    rowMin = cost[i][j];
                }
            }

            for (let j = 0; j < d.length; j++) {

                if (!activeCols[j]) continue;

                let colMin = Infinity;

                for (let k = 0; k < s.length; k++) {

                    if (
                        activeRows[k] &&
                        cost[k][j] < colMin
                    ) {

                        colMin = cost[k][j];
                    }
                }

                if (
                    cost[i][j] === rowMin &&
                    cost[i][j] === colMin
                ) {

                    let x = Math.min(s[i], d[j]);

                    res[i][j] = x;

                    s[i] -= x;
                    d[j] -= x;

                    if (s[i] === 0) {

                        activeRows[i] = false;
                    }

                    if (d[j] === 0) {

                        activeCols[j] = false;
                    }

                    found = true;
                }
            }
        }

        if (!found) {

            let min = Infinity;
            let mi = -1;
            let mj = -1;

            for (let i = 0; i < s.length; i++) {

                for (let j = 0; j < d.length; j++) {

                    if (
                        activeRows[i] &&
                        activeCols[j] &&
                        cost[i][j] < min
                    ) {

                        min = cost[i][j];

                        mi = i;
                        mj = j;
                    }
                }
            }

            if (mi === -1) break;

            let x = Math.min(s[mi], d[mj]);

            res[mi][mj] = x;

            s[mi] -= x;
            d[mj] -= x;

            if (s[mi] === 0) {

                activeRows[mi] = false;
            }

            if (d[mj] === 0) {

                activeCols[mj] = false;
            }
        }

        let done = true;

        for (let i = 0; i < s.length; i++) {
            if (s[i] > 0) done = false;
        }

        for (let j = 0; j < d.length; j++) {
            if (d[j] > 0) done = false;
        }

        if (done) break;
    }

    return res;
}

function renderTask() { // відображення

    let html = "<table><tr><th></th>";

    demand.forEach((_, j) => {

        let isFakeConsumer =
            fakeConsumer &&
            j === demand.length - 1;

        html += `
        <th>
            ${isFakeConsumer ? "ФС" : "P" + (j + 1)}
        </th>`;
    });

    html += "<th>Запас</th></tr>";

    supply.forEach((s, i) => {

        let isFakeSupplier =
            fakeSupplier &&
            i === supply.length - 1;

        html += `<tr>`;

        html += `
        <th>
            ${isFakeSupplier ? "ФП" : "C" + (i + 1)}
        </th>`;

        demand.forEach((_, j) => {

            html += `
            <td>

                <div style="font-size:12px;color:#666;">
                    ${cost[i][j]}
                </div>

                <input
                    id="c-${i}-${j}"
                    onchange="makeAllocation(${i},${j})"
                >

            </td>`;
        });

        html += `
        <td>
            <b id="supply-view-${i}">
                ${currentSupply[i]}
            </b>
        </td>`;

        html += "</tr>";
    });

    html += "<tr><th>Потреби</th>";

    demand.forEach((d, j) => {

        html += `
        <td>
            <b id="demand-view-${j}">
                ${currentDemand[j]}
            </b>
        </td>`;
    });

    html += "</tr></table>";

    html += `
    <div style="margin-top:20px;">

        <b>Ваша вартість:</b>

        <input id="userCostInput">

        <button onclick="checkCost()">
            Перевірити
        </button>

        <div id="costFeedback"></div>

    </div>
    `;

    document.getElementById("task").innerHTML = html;
}

function makeAllocation(i, j) { //Поставка

    if (
        blockedRows[i] ||
        blockedCols[j]
    ) {
        return;
    }

    let el =
        document.getElementById(`c-${i}-${j}`);

    let val = +el.value || 0;

    if (
        val > currentSupply[i] ||
        val > currentDemand[j]
    ) {

        showMessage(
            "Поставка перевищує залишки",
            "error"
        );

        el.value = "";

        return;
    }

    currentSupply[i] -= val;
    currentDemand[j] -= val;

    updateHeaders();

    if (mode.value === "train") {

        let correctVal = correct[i][j];

        if (val === correctVal) {

            el.className = "correct";

        } else {

            el.className = "wrong";
        }
    }

    if (
        currentSupply[i] === 0 &&
        currentDemand[j] === 0
    ) {

        askBlockChoice(i, j);

    } else if (currentSupply[i] === 0) {

        highlightRow(i);

    } else if (currentDemand[j] === 0) {

        highlightCol(j);
    }
}

function updateHeaders() { //оновлення таблиці

    for (let i = 0; i < currentSupply.length; i++) {

        document.getElementById(
            `supply-view-${i}`
        ).innerText = currentSupply[i];
    }

    for (let j = 0; j < currentDemand.length; j++) {

        document.getElementById(
            `demand-view-${j}`
        ).innerText = currentDemand[j];
    }
}

function highlightRow(i) { //виклеслення рядка

    blockedRows[i] = true;

    for (let j = 0; j < demand.length; j++) {

        let el =
            document.getElementById(`c-${i}-${j}`);

        if (el) {

            el.disabled = true;
        }
    }
}

function highlightCol(j) { //викреслення стовпця

    blockedCols[j] = true;

    for (let i = 0; i < supply.length; i++) {

        let el =
            document.getElementById(`c-${i}-${j}`);

        if (el) {

            el.disabled = true;
        }
    }
}

function askBlockChoice(i, j) { 

    let choice = confirm(
        "OK → викреслити рядок\n" +
        "Cancel → викреслити стовпець"
    );

    if (choice) {

        highlightRow(i);

    } else {

        highlightCol(j);
    }
}

function checkSolution() { //перевірка

    if (mode.value === "train") {

        showMessage(
            "У режимі тренажера перевірка не потрібна",
            "info"
        );

        return;
    }

    let errors = 0;

    for (let i = 0; i < supply.length; i++) {

        for (let j = 0; j < demand.length; j++) {

            let el =
                document.getElementById(`c-${i}-${j}`);

            let val = +el.value || 0;

            if (val === correct[i][j]) {

                el.className = "correct";

            } else {

                el.className = "wrong";

                errors++;
            }
        }
    }

    showMessage(
        errors === 0
            ? "Все правильно 🎉"
            : "Є помилки: " + errors,

        errors === 0
            ? "success"
            : "error"
    );
}

function calculateCorrectCost() { //цільова функція

    let total = 0;

    for (let i = 0; i < cost.length; i++) {

        for (let j = 0; j < cost[i].length; j++) {

            total +=
                cost[i][j] * correct[i][j];
        }
    }

    return total;
}

function checkCost() { //перевірка вартості

    let user =
        +document.getElementById(
            "userCostInput"
        ).value;

    let correctVal =
        calculateCorrectCost();

    let feedback =
        document.getElementById(
            "costFeedback"
        );

    if (user === correctVal) {

        feedback.innerText =
            "✅ Правильно!";

        feedback.style.color = "green";

    } else {

        costAttempts++;

        if (costAttempts >= 3) {

            feedback.innerText =
                "❗ Правильна: " + correctVal;

            feedback.style.color = "orange";

        } else {

            feedback.innerText =
                "❌ Неправильно";

            feedback.style.color = "red";
        }
    }
}

function showCorrect() {

    for (let i = 0; i < supply.length; i++) {

        for (let j = 0; j < demand.length; j++) {

            let el =
                document.getElementById(`c-${i}-${j}`);

            if (el) {

                el.value = correct[i][j];

                el.disabled = true;

                el.classList.add("correct");
            }
        }
    }

    showMessage(
        "Рішення показано",
        "success"
    );
}

function clearInfo() {

    attempts = {};

    costAttempts = 0;
}

function saveData() {

    localStorage.setItem(
        "cost",
        JSON.stringify(cost)
    );

    localStorage.setItem(
        "plan",
        JSON.stringify(correct)
    );
}
