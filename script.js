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

// 役の点数定数
const SCORE_GEKKA_MUSO=10;
const SCORE_SANKO=6;
const SCORE_INOSHIKACHO=5;
const SCORE_OMOTE_SUGAWARA=5;
const SCORE_TANZAKU=5;
const SCORE_HANAMIZAKE=4;
const SCORE_TSUKIMIZAKE=4;
const SCORE_MITSU_ZOROI=3;
const SCORE_SANCHO=3;
const SCORE_TSUNAGI=2;
const SCORE_KASU=1;

//山札の補充
function replenishDeck(){
    if (deck.length>=10){
      return;
    }

    const cardTemplates=[
        ['light','tan','kasu','kasu'],['tane','tan','kasu','kasu'],
        ['light','tan','kasu','kasu'],['tane','tan','kasu','kasu'],
        ['tane','tan','kasu','kasu'],['tane','tan','kasu','kasu'],
        ['tane','tan','kasu','kasu'],['light','tane','kasu','kasu'],
        ['tane','tan','kasu','kasu'],['tane','tan','kasu','kasu'],
        ['light','tane','tan','kasu'],['light','kasu','kasu','kasu']
    ];

    const currentHandCardIds=new Set([...playerHand, ...cpuHand].map(card => card.id));
    const newCards=[];

    for (let month=1;month<=12;month++) {
        for (let i=0;i<4;i++) {
            const cardId=`${month}-${i}`;
            if(!currentHandCardIds.has(cardId)&&!deck.some(card=>card.id===cardId)){
                newCards.push({ id: cardId, month: month, type: cardTemplates[month-1][i]});
            }
        }
    }
    deck=[...newCards.sort(()=>Math.random()-0.5),...deck];
}

//描画処理
function render(showCpuHand){
    const playerHandDisplay=document.getElementById('p-h');
    const cpuHandDisplay=document.getElementById('c-h');
    if (!playerHandDisplay||!cpuHandDisplay){
     return;
   }

    playerHandDisplay.innerHTML='';
    cpuHandDisplay.innerHTML='';

    playerHand.forEach(card=>{
        const cardElement=document.createElement('div');
        const isSelected=selectedIds.has(card.id);
        const isHighlight=card.month===fieldMonth;
        cardElement.className=`cd ${isSelected?'sel' : ''} ${isHighlight?'hl' : ''}`;
        cardElement.innerHTML=`<div class="ml">${card.month}</div><div class="tl">${card.type}</div>`;
        cardElement.onclick=()=>{
            if (!isGameOver) {
                selectedIds.has(card.id)?selectedIds.delete(card.id) : selectedIds.add(card.id);
                render(showCpuHand);
            }
        };
        playerHandDisplay.appendChild(cardElement);
    });

    cpuHand.forEach((card,index)=>{
        const cardElement=document.createElement('div');
        cardElement.className=`cd cpu`;
        if (showCpuHand) {
            if (card.month===fieldMonth){
              cardElement.classList.add('hl');
            }
            if (index<3){
              cardElement.style.border="2px solid var(--a)";
            }
            cardElement.innerHTML=`<div class="ml">${card.month}</div><div class="tl">${card.type}</div>`;
        } else {
            cardElement.style.background="#444";
        }
        cpuHandDisplay.appendChild(cardElement);
    });
}

//ゲーム開始/リセット処理
function initializeGame(){
    playerHp=cpuHp=MAX_HP;
    isGameOver=hasRedrawn=false;
    fieldMonth=Math.floor(Math.random()*12)+1;

    const fmDisplay=document.getElementById('fm-n');
    if (fmDisplay){
      fmDisplay.innerText=`${fieldMonth}(${MONTH_NAMES[fieldMonth]})`;
    }

    deck=[];
    replenishDeck();
    playerHand=[];
    cpuHand = [];
    for (let i=0;i<HAND_COUNT;i++){
        playerHand.push(deck.pop());
        cpuHand.push(deck.pop());
    }

    selectedIds.clear();
    render(0);
    updateUI();

    document.getElementById('a-btn').disabled=false;
    document.getElementById('r-btn').disabled=false;
    showMessage("ゲーム開始！勝負する3枚を選んでね。");
}

// 引き直し
function redrawCards(){
    if (isGameOver||hasRedrawn||selectedIds.size===0){
      return;
    }

    playerHand=playerHand.filter(card=>!selectedIds.has(card.id));
    while(playerHand.length<HAND_COUNT){
        replenishDeck();
        playerHand.push(deck.pop());
    }

    hasRedrawn=true;
    document.getElementById('r-btn').disabled=true;
    selectedIds.clear();

    render(0);
    updateUI();
    showMessage("引き直しました。勝負する3枚を選んでね！");
}

//役判定
function judge(cards){
    const months=cards.map(c=>c.month);
    const types=cards.map(c=>c.type);
    const isSameMonth=months.every(m=>m==months[0]);
    const lightCount=types.filter(t=>t=='light').length;
    const taneCount=types.filter(t=>t=='tane').length;
    const tanCount=types.filter(t=>t=='tan').length;
    const kasuCount=types.filter(t=>t=='kasu').length;
    const fieldMonthMatchCount=months.filter(m=>m==fieldMonth).length;

    let result={ name: "役なし", damage: 0, isSpecial: 0, bonus: (fieldMonthMatchCount>0&&fieldMonthMatchCount<3)?fieldMonthMatchCount : 0 };

    if(isSameMonth&&months[0]==fieldMonth){
        result={ name: "月下無双", damage: SCORE_GEKKA_MUSO, isSpecial: 1, bonus: 0 };
    } else if(lightCount == 3){
        result={ name: "三光", damage: SCORE_SANKO, bonus: result.bonus };
    } else if(
        cards.some(c=>c.month==10&&c.type=='tane')&&
        cards.some(c=>c.month==7&&c.type=='tane')&&
        cards.some(c=>c.month==6&&c.type=='tane')
    ){
        result={ name: "猪鹿蝶", damage: SCORE_INOSHIKACHO, bonus: result.bonus };
    }else if(
        cards.some(c=>c.month==1&&c.type=='light')&&
        cards.some(c=>c.month==2&&c.type=='tane')&&
        cards.some(c=>c.month==3&&c.type=='light')
    ){
        result={ name: "表菅原", damage: SCORE_OMOTE_SUGAWARA, bonus: result.bonus };
    } else if(tanCount==3&&([1,2,3].every(m=>months.includes(m))||[6,9,10].every(m=>months.includes(m)))){
        result={ name: "短冊役", damage: SCORE_TANZAKU, bonus: result.bonus };
    } else if(cards.some(c => c.month == 3 && c.type == 'light') && cards.some(c => c.month == 9 && c.type == 'tane')) {
        result={ name: "花見酒", damage: SCORE_HANAMIZAKE, bonus: result.bonus };
    } else if(cards.some(c=>c.month==8&&c.type=='light')&&cards.some(c=>c.month==9&&c.type=='tane')){
        result={ name: "月見酒", damage: SCORE_TSUKIMIZAKE, bonus: result.bonus };
    } else if(isSameMonth){
        result={ name: "三つ揃い", damage: SCORE_MITSU_ZOROI, bonus: 0 };
    } else if(taneCount == 3||tanCount == 3){
        result={ name: "三丁", damage: SCORE_SANCHO, bonus: result.bonus };
    } else if(taneCount>=2||tanCount>= 2){
        result={ name: "繋ぎ", damage: SCORE_TSUNAGI, bonus: result.bonus };
    } else if(kasuCount==3) {
        result={ name: "カス", damage: SCORE_KASU, bonus: result.bonus };
    }
    return result;
}

//攻撃処理
async function executeAttack(){
    if(selectedIds.size!==3||isGameOver){
       return;
     }

    const attackBtn=document.getElementById('a-btn'), redrawBtn=document.getElementById('r-btn');
    attackBtn.disabled=redrawBtn.disabled=true;

    //CPUの思考（ソート）
    cpuHand.sort((cardA,cardB)=>{
        const getEvaluationScore=(card)=>{
            let score=0;
            if(card.month===fieldMonth){
              score+=1000;
            }
            const monthMatchCount=cpuHand.filter(c=>c.month===card.month).length;
            if(monthMatchCount>=2){
               score+=(monthMatchCount*50);
            }
            if(card.type!=='kasu'){
                const typeMatchCount=cpuHand.filter(c=>c.type===card.type).length;
                score+=(typeMatchCount*20);
            }
            return score;
        };
        return getEvaluationScore(cardB)-getEvaluationScore(cardA);
    });

    const playerSelectedCards=playerHand.filter(c=>selectedIds.has(c.id));
    const cpuSelectedCards=cpuHand.slice(0,3);

    render(1); // CPUの手札公開
    const playerResult=judge(playerSelectedCards), cpuResult=judge(cpuSelectedCards);
    const playerTotalScore=playerResult.damage+playerResult.bonus, cpuTotalScore=cpuResult.damage+cpuResult.bonus;

    let damageToCpu=playerResult.isSpecial?playerResult.damage : Math.max(0,playerTotalScore-cpuTotalScore);
    let damageToPlayer=cpuResult.isSpecial?cpuResult.damage : Math.max(0,cpuTotalScore-playerTotalScore);

    showMessage(`${playerResult.name}(${playerTotalScore})vs${cpuResult.name}(${cpuTotalScore})<br>CPUに${damageToCpu}ダメージ！`);
    cpuHp-=damageToCpu;
    updateUI();

    if(cpuHp<=0){
        isGameOver=true;
        showMessage(`<b style="color:var(--g);font-size:1.4rem">勝ち！</b>`);
        return;
    }

    await new Promise(resolve=>setTimeout(resolve,1200));
    playerHp-=damageToPlayer;
    updateUI();
    showMessage(`${playerResult.name}vs${cpuResult.name}<br>${damageToPlayer}の反撃を受けた！`);

    if(playerHp<=0){
        isGameOver=true;
        showMessage(`<b style="color:red;font-size:1.4rem">負け...</b>`);
        return;
    }

    await new Promise(resolve=>setTimeout(resolve,1200));

    //次ターン準備
    replenishDeck();
    playerHand=[];
    cpuHand=[];
    for (let i=0;i<HAND_COUNT;i++){
        replenishDeck();
        playerHand.push(deck.pop());
        cpuHand.push(deck.pop());
    }

    hasRedrawn=false;
    attackBtn.disabled=false;
    redrawBtn.disabled=false;
    selectedIds.clear();
    render(0);
    updateUI();
    showMessage("次ターン：3枚選んでね");
}

// UI更新
function updateUI(){
    document.getElementById('chp-v').innerText=Math.max(0,cpuHp);
    document.getElementById('php-v').innerText=Math.max(0,playerHp);
    document.getElementById('chp-f').style.width=(Math.max(0,cpuHp)/MAX_HP*100)+"%";
    document.getElementById('php-f').style.width=(Math.max(0,playerHp)/MAX_HP*100)+"%";
    document.getElementById('dc').innerText=deck.length;
}

function showMessage(msgText){
   document.getElementById('log').innerHTML=msgText;
 }

function toggleRuleModal(){
    const modal=document.getElementById('rule-modal');
    modal.style.display=(modal.style.display==='flex')?'none' : 'flex';
}

function switchTab(tabId){
    document.querySelectorAll('.tab-body').forEach(el=>el.style.display='none');
    const targetTab=document.getElementById(tabId);
    if (targetTab){
      targetTab.style.display='block';
    }
}

// 初回実行
initializeGame();
