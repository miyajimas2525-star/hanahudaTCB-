//状態管理

let deck=[];
let playerHp=20;
let cpuHp=20;
let fieldMonth=1;
let playerHand=[];
let cpuHand=[];
let selectedIds=new Set();
let isGameOver=false;
let hasRedrawn=false;

//定数
const MAX_HP=20;
const HAND_COUNT=5;
const MONTH_NAMES=["","松","梅","桜","藤","菖","牡丹","萩","月","菊","紅葉","柳","桐"];

//山札の補充
function rep(){
    if (deck.length >= 10){
      return;
    }

    const templates=[
        ['light','tan','kasu','kasu'],['tane','tan','kasu','kasu'],
        ['light','tan','kasu','kasu'],['tane','tan','kasu','kasu'],
        ['tane','tan','kasu','kasu'],['tane','tan','kasu','kasu'],
        ['tane','tan','kasu','kasu'],['light','tane','kasu','kasu'],
        ['tane','tan','kasu','kasu'],['tane','tan','kasu','kasu'],
        ['light','tane','tan','kasu'],['light','kasu','kasu','kasu']
    ];

    const currentIds=new Set([...playerHand, ...cpuHand].map(c => c.id));
    const newCards=[];

    for (let m=1;m<=12;m++) {
        for (let i=0;i<4;i++) {
            const cid=`${m}-${i}`;
            if(!currentIds.has(cid) && !deck.some(c=>c.id===cid)){
                newCards.push({ id: cid,month: m,type: templates[m-1][i]});
            }
        }
    }
    deck=[...newCards.sort(()=>Math.random()-0.5),...deck];
}

//描画処理
function ren(showCpuHand){
    const pD=document.getElementById('p-h');
    const cD=document.getElementById('c-h');
    if (!pD||!cD){
     return;
   }

    pD.innerHTML='';
    cD.innerHTML='';

    playerHand.forEach(card=>{
        const e=document.createElement('div');
        const isSelected=selectedIds.has(card.id);
        const isHighlight=card.month===fieldMonth;
        e.className=`cd ${isSelected?'sel' : ''} ${isHighlight?'hl' : ''}`;
        e.innerHTML=`<div class="ml">${card.month}</div><div class="tl">${card.type}</div>`;
        e.onclick=()=>{
            if (!isGameOver) {
                selectedIds.has(card.id)?selectedIds.delete(card.id) : selectedIds.add(card.id);
                ren(showCpuHand);
            }
        };
        pD.appendChild(e);
    });

    cpuHand.forEach((card,i)=>{
        const e=document.createElement('div');
        e.className=`cd cpu`;
        if (showCpuHand) {
            if (card.month===fieldMonth){
              e.classList.add('hl');
            }
            if (i<3){
              e.style.border="2px solid var(--a)";
            }
            e.innerHTML=`<div class="ml">${card.month}</div><div class="tl">${card.type}</div>`;
        } else {
            e.style.background="#444";
        }
        cD.appendChild(e);
    });
}

//ゲーム開始/リセット処理
function init(){
    playerHp=cpuHp=MAX_HP;
    isGameOver=hasRedrawn=false;
    fieldMonth=Math.floor(Math.random()*12)+1;

    const fmDisplay=document.getElementById('fm-n');
    if (fmDisplay){
      fmDisplay.innerText=`${fieldMonth}(${MONTH_NAMES[fieldMonth]})`;
    }

    deck=[];
    rep();
    playerHand=[];
    cpuHand = [];
    for (let i=0;i<HAND_COUNT;i++) {
        playerHand.push(deck.pop());
        cpuHand.push(deck.pop());
    }

    selectedIds.clear();
    ren(0);
    upd();

    document.getElementById('a-btn').disabled=false;
    document.getElementById('r-btn').disabled=false;
    msg("ゲーム開始！勝負する3枚を選んでね。");
}

// 引き直し
function draw() {
    if (isGameOver||hasRedrawn||selectedIds.size===0){
      return;
    }

    playerHand=playerHand.filter(card=>!selectedIds.has(card.id));
    while(playerHand.length<HAND_COUNT){
        rep();
        playerHand.push(deck.pop());
    }

    hasRedrawn=true;
    document.getElementById('r-btn').disabled=true;
    selectedIds.clear();

    ren(0);
    upd();
    msg("引き直しました。勝負する3枚を選んでね！");
}

//役判定
function judge(cards) {
    const ms=cards.map(c=>c.month);
    const ts=cards.map(c=>c.type);
    const same=ms.every(m=>m==ms[0]);
    const lc=ts.filter(t=>t=='light').length;
    const te=ts.filter(t=>t=='tane').length;
    const tn=ts.filter(t=>t=='tan').length;
    const kc=ts.filter(t=>t=='kasu').length;
    const fmCount=ms.filter(m=>m==fieldMonth).length;

    let r={n: "役なし",d: 0,p: 0,b: (fmCount>0&&fmCount<3)?fmCount : 0 };

    if(same&&ms[0]==fieldMonth){
        r={n: "月下無双",d: 10,p: 1,b: 0};
    } else if(lc == 3) {
        r={ n:"三光",d: 6,b: r.b};
    } else if(
        cards.some(c=>c.month==10&&c.type=='tane')&&
        cards.some(c=>c.month==7&&c.type=='tane')&&
        cards.some(c=>c.month==6&&c.type=='tane')
    ){
        r={n: "猪鹿蝶",d: 5,b: r.b};
    }else if(
        cards.some(c=>c.month==1&&c.type=='light')&&
        cards.some(c=>c.month==2&&c.type=='tane')&&
        cards.some(c=>c.month==3&&c.type=='light')
    ){
        r={n: "表菅原",d: 5, b: r.b};
    } else if(tn==3&&([1,2,3].every(m=>ms.includes(m))||[6,9,10].every(m=>ms.includes(m)))){
        r={n: "短冊役",d: 5,b: r.b};
    } else if(cards.some(c => c.month == 3 && c.type == 'light') && cards.some(c => c.month == 9 && c.type == 'tane')) {
        r={n: "花見酒",d: 4,b: r.b};
    } else if(cards.some(c=>c.month==8&&c.type=='light')&&cards.some(c=>c.month==9&&c.type=='tane')){
        r={n: "月見酒",d: 4,b: r.b};
    } else if(same){
        r={n: "三つ揃い",d: 3,b: 0};
    } else if(te == 3||tn == 3){
        r={n: "三丁",d: 3,b: r.b};
    } else if(te>=2||tn>= 2){
        r={n: "繋ぎ",d: 2,b: r.b};
    } else if(kc==3) {
        r={n: "カス",d: 1,b: r.b};
    }
    return r;
}

//攻撃処理
async function atk(){
    if(selectedIds.size!==3||isGameOver){
       return;
     }

    const ab=document.getElementById('a-btn'),rb=document.getElementById('r-btn');
    ab.disabled=rb.disabled=true;

    //CPUの思考（ソート）
    cpuHand.sort((a,b)=>{
        const getScore=(card)=>{
            let s=0;
            if(card.month===fieldMonth){
              s+=1000;
            }
            const mCount=cpuHand.filter(c=>c.month===card.month).length;
            if(mCount>=2){
               s+=(mCount*50);
            }
            if(card.type!=='kasu'){
                const tCount=cpuHand.filter(c=>c.type===card.type).length;
                s+=(tCount*20);
            }
            return s;
        };
        return getScore(b)-getScore(a);
    });

    const pSelected=playerHand.filter(c=>selectedIds.has(c.id));
    const cSelected=cpuHand.slice(0,3);

    ren(1); // CPUの手札公開
    const pR=judge(pSelected),cR=judge(cSelected);
    const pT=pR.d+pR.b,cT=cR.d+cR.b;

    let dC=pR.p?pR.d : Math.max(0,pT-cT);
    let dP=cR.p?cR.d : Math.max(0,cT-pT);

    msg(`${pR.n}(${pT})vs${cR.n}(${cT})<br>CPUに${dC}ダメージ！`);
    cpuHp-=dC;
    upd();

    if(cpuHp<=0){
        isGameOver=true;
        msg(`<b style="color:var(--g);font-size:1.4rem">勝ち！</b>`);
        return;
    }

    await new Promise(r=>setTimeout(r,1200));
    playerHp-=dP;
    upd();
    msg(`${pR.n}vs${cR.n}<br>${dP}の反撃を受けた！`);

    if(playerHp<=0){
        isGameOver=true;
        msg(`<b style="color:red;font-size:1.4rem">負け...</b>`);
        return;
    }

    await new Promise(r=>setTimeout(r,1200));

    //次ターン準備
    rep();
    playerHand=[];
    cpuHand=[];
    for (let i=0;i<HAND_COUNT;i++){
        rep();
        playerHand.push(deck.pop());
        cpuHand.push(deck.pop());
    }

    hasRedrawn=false;
    ab.disabled=false;
    rb.disabled=false;
    selectedIds.clear();
    ren(0);
    upd();
    msg("次ターン：3枚選んでね");
}

// UI更新
function upd() {
    document.getElementById('chp-v').innerText=Math.max(0,cpuHp);
    document.getElementById('php-v').innerText=Math.max(0,playerHp);
    document.getElementById('chp-f').style.width=(Math.max(0,cpuHp)/MAX_HP*100)+"%";
    document.getElementById('php-f').style.width=(Math.max(0,playerHp)/MAX_HP*100)+"%";
    document.getElementById('dc').innerText=deck.length;
}

function msg(m){
   document.getElementById('log').innerHTML=m;
 }

function tgl(){
    const m=document.getElementById('rule-modal');
    m.style.display=(m.style.display==='flex')?'none' : 'flex';
}

function tab(id){
    document.querySelectorAll('.tab-body').forEach(el=>el.style.display='none');
    const target=document.getElementById(id);
    if (target){
      target.style.display='block';
    }
}

init();
