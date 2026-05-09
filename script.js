let supply = [], demand = [], cost = [], correct = [];
let attempts = {};
let costAttempts = 0;

//Повідомлення
function showMessage(text, type="info"){
  let msg = document.getElementById("message");
  msg.innerText = text;
  msg.className = "";
  msg.classList.add(`msg-${type}`);
  msg.style.display = "block";
  setTimeout(()=> msg.style.display="none", 3000);
}

//Генерація
function generateTask(){
  let r = +rows.value;
  let c = +cols.value;

  supply = Array.from({length:r},()=>Math.floor(Math.random()*20+5));
  demand = Array.from({length:c},()=>Math.floor(Math.random()*20+5));

  let sumS = supply.reduce((a,b)=>a+b,0);
  let sumD = demand.reduce((a,b)=>a+b,0);
  demand[c-1] += sumS - sumD;

  cost = Array.from({length:r},()=>Array.from({length:c},
    ()=>Math.floor(Math.random()*20+1)
  ));

  balance();
  solve();
  renderTask();
  clearInfo();
}

//Ввід таблиці вчручну
function enableCustom(){
  let r = +rows.value;
  let c = +cols.value;

  let html = "<table>";

  html += "<tr><th></th>";
  for(let j=0;j<c;j++) html+=`<th>P${j+1}</th>`;
  html += "<th>Запас</th></tr>";

  for(let i=0;i<r;i++){
    html+=`<tr><th>C${i+1}</th>`;
    for(let j=0;j<c;j++){
      html+=`<td><input id="cost-${i}-${j}" type="number"></td>`;
    }
    html+=`<td><input id="supply-${i}" type="number"></td></tr>`;
  }

  html+="<tr><th>Потреби</th>";
  for(let j=0;j<c;j++){
    html+=`<td><input id="demand-${j}" type="number"></td>`;
  }
  html+="</tr></table>";

  html+=`<br><button class="btn" onclick="applyCustom()">Застосувати</button>`;

  document.getElementById("task").innerHTML = html;
}
//Приміняємо
function applyCustom(){
  try{
    let r = +rows.value;
    let c = +cols.value;

    cost=[]; supply=[]; demand=[];

    for(let i=0;i<r;i++){
      cost[i]=[];
      for(let j=0;j<c;j++){
        cost[i][j] = +document.getElementById(`cost-${i}-${j}`).value || 0;
      }
    }

    for(let i=0;i<r;i++){
      supply[i] = +document.getElementById(`supply-${i}`).value || 0;
    }

    for(let j=0;j<c;j++){
      demand[j] = +document.getElementById(`demand-${j}`).value || 0;
    }

    balance();
    solve();
    renderTask();
    clearInfo();

    showMessage("Дані введено вручну ✅","success");

  }catch(e){
    console.error(e);
    showMessage("Помилка введення","error");
  }
}

//Балансування
function balance(){
  let sumS = supply.reduce((a,b)=>a+b,0);
  let sumD = demand.reduce((a,b)=>a+b,0);

  if(sumS > sumD){
    demand.push(sumS-sumD);
    cost.forEach(r=>r.push(0));
  } else if(sumD > sumS){
    supply.push(sumD-sumS);
    cost.push(Array(demand.length).fill(0));
  }
}

//Вирішення
function solve(){
  let m = method.value;

  if(m==="nw") correct = northWest();
  else if(m==="min") correct = minCost();
  else if(m==="double") correct = doublePreference();
  else if(m==="vogel") correct = vogel();
}

//ПЗК
function northWest(){
  let s=[...supply], d=[...demand];
  let res=Array.from({length:s.length},()=>Array(d.length).fill(0));

  let i=0,j=0;
  while(i<s.length && j<d.length){
    let x=Math.min(s[i],d[j]);
    res[i][j]=x;
    s[i]-=x; d[j]-=x;
    if(s[i]==0)i++; else j++;
  }
  return res;
}

//Мінімальний тариф
function minCost(){
  let s=[...supply], d=[...demand];
  let res=Array.from({length:s.length},()=>Array(d.length).fill(0));

  while(true){
    let min=Infinity,mi=-1,mj=-1;

    for(let i=0;i<s.length;i++){
      for(let j=0;j<d.length;j++){
        if(s[i]>0 && d[j]>0 && cost[i][j]<min){
          min=cost[i][j]; mi=i; mj=j;
        }
      }
    }

    if(mi==-1) break;

    let x=Math.min(s[mi],d[mj]);
    res[mi][mj]=x;
    s[mi]-=x; d[mj]-=x;
  }

  return res;
}

//Фогель
function vogel(){
  let s=[...supply], d=[...demand];
  let res=Array.from({length:s.length},()=>Array(d.length).fill(0));
  let activeRows=Array(s.length).fill(true);
  let activeCols=Array(d.length).fill(true);

  while(true){
    let penalties=[];

    for(let i=0;i<s.length;i++){
      if(!activeRows[i]) continue;
      let arr=[];
      for(let j=0;j<d.length;j++){
        if(activeCols[j]) arr.push(cost[i][j]);
      }
      if(arr.length<2) continue;
      arr.sort((a,b)=>a-b);
      penalties.push({type:"row", index:i, value:arr[1]-arr[0]});
    }

    for(let j=0;j<d.length;j++){
      if(!activeCols[j]) continue;
      let arr=[];
      for(let i=0;i<s.length;i++){
        if(activeRows[i]) arr.push(cost[i][j]);
      }
      if(arr.length<2) continue;
      arr.sort((a,b)=>a-b);
      penalties.push({type:"col", index:j, value:arr[1]-arr[0]});
    }

    if(!penalties.length){
      for(let i=0;i<s.length;i++){
        for(let j=0;j<d.length;j++){
          if(activeRows[i] && activeCols[j]){
            let x=Math.min(s[i],d[j]);
            res[i][j]=x;
            s[i]-=x; d[j]-=x;
          }
        }
      }
      break;
    }

    penalties.sort((a,b)=>b.value-a.value);
    let best=penalties[0];

    let mi=-1, mj=-1;

    if(best.type==="row"){
      mi = best.index;
      let min = Infinity;
      for(let j=0;j<d.length;j++){
        if(activeCols[j] && cost[mi][j] < min){
          min = cost[mi][j];
          mj = j;
        }
      }
    } else {
      mj = best.index;
      let min = Infinity;
      for(let i=0;i<s.length;i++){
        if(activeRows[i] && cost[i][mj] < min){
          min = cost[i][mj];
          mi = i;
        }
      }
    }

    let x = Math.min(s[mi], d[mj]);
    res[mi][mj] = x;

    s[mi] -= x;
    d[mj] -= x;

    if(s[mi]===0) activeRows[mi]=false;
    if(d[mj]===0) activeCols[mj]=false;
  }

  return res;
}
//Метод подвйної переваги
function doublePreference(){

  let s = [...supply];
  let d = [...demand];

  let res = Array.from(
    {length:s.length},
    ()=>Array(d.length).fill(0)
  );

  let activeRows = Array(s.length).fill(true);
  let activeCols = Array(d.length).fill(true);

  while(true){

    let found = false;

    // ===== ШУКАЄМО ПОДВІЙНУ ПЕРЕВАГУ =====
    for(let i=0;i<s.length;i++){

      if(!activeRows[i]) continue;

      // мінімум у рядку
      let rowMin = Infinity;

      for(let j=0;j<d.length;j++){
        if(activeCols[j] && cost[i][j] < rowMin){
          rowMin = cost[i][j];
        }
      }

      for(let j=0;j<d.length;j++){

        if(!activeCols[j]) continue;

        // мінімум у стовпці
        let colMin = Infinity;

        for(let k=0;k<s.length;k++){
          if(activeRows[k] && cost[k][j] < colMin){
            colMin = cost[k][j];
          }
        }

        // ===== ПОДВІЙНА ПЕРЕВАГА =====
        if(cost[i][j] === rowMin &&
           cost[i][j] === colMin){

          let x = Math.min(s[i], d[j]);

          res[i][j] = x;

          s[i] -= x;
          d[j] -= x;

          if(s[i] === 0){
            activeRows[i] = false;
          }

          if(d[j] === 0){
            activeCols[j] = false;
          }

          found = true;
        }
      }
    }

    // ===== ЯКЩО ПОДВІЙНОЇ ПЕРЕВАГИ НЕМАЄ =====
    if(!found){

      let min = Infinity;
      let mi = -1;
      let mj = -1;

      for(let i=0;i<s.length;i++){
        for(let j=0;j<d.length;j++){

          if(
            activeRows[i] &&
            activeCols[j] &&
            cost[i][j] < min
          ){
            min = cost[i][j];
            mi = i;
            mj = j;
          }
        }
      }

      if(mi === -1) break;

      let x = Math.min(s[mi], d[mj]);

      res[mi][mj] = x;

      s[mi] -= x;
      d[mj] -= x;

      if(s[mi] === 0){
        activeRows[mi] = false;
      }

      if(d[mj] === 0){
        activeCols[mj] = false;
      }
    }

    // ===== ПЕРЕВІРКА ЗАВЕРШЕННЯ =====
    let done = true;

    for(let i=0;i<s.length;i++){
      if(s[i] > 0) done = false;
    }

    for(let j=0;j<d.length;j++){
      if(d[j] > 0) done = false;
    }

    if(done) break;
  }

  return res;
}

function renderTask(){
  let html="<table><tr><th></th>";

  demand.forEach((_,j)=>html+=`<th>P${j+1}</th>`);
  html+="<th>Запас</th></tr>";

  supply.forEach((s,i)=>{
    html+=`<tr><th>C${i+1}</th>`;
    demand.forEach((_,j)=>{
      html+=`
      <td>
        <div style="font-size:12px; color:#666;">${cost[i][j]}</div>
        <input id="c-${i}-${j}" oninput="checkCell(${i},${j})">
      </td>`;
    });
    html+=`<td><b>${s}</b></td></tr>`;
  });

  html+="<tr><th>Потреби</th>";
  demand.forEach(d=>html+=`<td><b>${d}</b></td>`);
  html+="</tr></table>";

  html += `
  <div style="margin-top:20px;">
    <b>Ваша вартість:</b>
    <input id="userCostInput">
    <button onclick="checkCost()">Перевірити</button>
    <div id="costFeedback"></div>
  </div>
  `;

  document.getElementById("task").innerHTML = html;
}

//перевірка клітинки
function checkCell(i,j){
  if(mode.value !== "train") return;

  let el = document.getElementById(`c-${i}-${j}`);
  let val = +el.value || 0;
  let correctVal = correct[i][j];

  let key = `${i}-${j}`;
  if(!attempts[key]) attempts[key]=0;

  if(val === correctVal){
    el.className="correct";
    el.disabled=true;
  } else {
    attempts[key]++;
    el.className="wrong";

    if(attempts[key]>=3){
      el.value = correctVal;
      el.disabled = true;
      showMessage("Показано правильне значення","info");
    } else {
      showMessage("Спробуй ще раз","error");
    }
  }
}

//Контроль
function checkSolution(){
  if(mode.value==="train"){
    showMessage("У режимі тренажера перевірка не потрібна","info");
    return;
  }

  let errors=0;

  for(let i=0;i<supply.length;i++){
    for(let j=0;j<demand.length;j++){
      let el=document.getElementById(`c-${i}-${j}`);
      let val=+el.value||0;

      if(val===correct[i][j]){
        el.className="correct";
      } else {
        el.className="wrong";
        errors++;
      }
    }
  }

  showMessage(errors===0?"Все правильно 🎉":"Є помилки: "+errors,
              errors===0?"success":"error");
}

//цільова функція
function calculateCorrectCost(){
  let total=0;
  for(let i=0;i<cost.length;i++){
    for(let j=0;j<cost[i].length;j++){
      total+=cost[i][j]*correct[i][j];
    }
  }
  return total;
}

//перевірка цільової
function checkCost(){
  let user=+document.getElementById("userCostInput").value;
  let correctVal=calculateCorrectCost();
  let feedback=document.getElementById("costFeedback");

  if(user===correctVal){
    feedback.innerText="✅ Правильно!";
    feedback.style.color="green";
  } else {
    costAttempts++;
    if(costAttempts>=3){
      feedback.innerText="❗ Правильна: "+correctVal;
      feedback.style.color="orange";
    } else {
      feedback.innerText="❌ Неправильно";
      feedback.style.color="red";
    }
  }
}

//Показати
function showCorrect(){
  for(let i=0;i<supply.length;i++){
    for(let j=0;j<demand.length;j++){
      let el=document.getElementById(`c-${i}-${j}`);
      if(el){
        el.value=correct[i][j];
        el.disabled=true;
      }
    }
  }
  showMessage("Рішення показано","success");
}

// ===== ОЧИСТКА =====
function clearInfo(){
  attempts={};
  costAttempts=0;
}
function saveData(){
  localStorage.setItem("cost", JSON.stringify(cost));
  localStorage.setItem("plan", JSON.stringify(correct));
}