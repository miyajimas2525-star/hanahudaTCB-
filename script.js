// d=山札, pHP/cHP=体力, fM=舞台月, pH/cH=手札, sId=選択ID, end=終了フラグ, red=引直済フラグ
let d=[], pHP=20, cHP=20, fM=1, pH=[], cH=[], sId=new Set(), end=0, red=0;

// 山札の補充
function rep() {
    if (d.length < 10) {
        console.log("--- 山札を補充します ---");
        const n=[];
        for(let m=1;m<=12;m++)for(let i=0;i<4;i++) n.push({id:`${m}-${i}-${Math.random()}`,m,t:(i==0&&[1,3,8,11,12].includes(m))?'light':(i==1?'tane':(i==2?'tan':'kasu'))});
        d=[...d,...n.sort(()=>Math.random()-.5)];
        console.log("補充後の山札枚数:", d.length);
    }
}

// ゲーム開始
function init() {
    console.log("=== ゲームをリセットします ===");
    pHP=cHP=20; end=red=0; fM=Math.floor(Math.random()*12)+1;
    const mn=["","松","梅","桜","藤","菖","牡丹","萩","月","菊","紅葉","柳","桐"];
    console.log(`今回の舞台月: ${fM} (${mn[fM]})`);

    document.getElementById('fm-n').innerText=`${fM}(${mn[fM]})`;
    d=[]; rep(); pH=[]; cH=[];
    for(let i=0;i<5;i++){ pH.push(d.pop()); cH.push(d.pop()); }

    console.log("プレイヤー手札:", pH);
    console.log("CPU手札:", cH);

    sId.clear(); ren(0); upd();
    document.getElementById('r-btn').disabled=0;
    msg("ゲーム開始！");
}

// 描画
function ren(sh) {
    const phD=document.getElementById('p-h'), chD=document.getElementById('c-h');
    phD.innerHTML=''; chD.innerHTML='';
    pH.forEach(c=>{
        const e=document.createElement('div'); e.className=`cd ${sId.has(c.id)?'sel':''} ${c.m==fM?'hl':''}`;
        e.innerHTML=`<div class="ml">${c.m}</div><div class="tl">${c.t}</div>`;
        e.onclick=()=>{
            if(!end){
                sId.has(c.id)?sId.delete(c.id):sId.add(c.id);
                console.log("選択中のカードID:", Array.from(sId));
                ren(sh);
            }
        };
        phD.appendChild(e);
    });
    cH.forEach((c,i)=>{
        const e=document.createElement('div'); e.className=`cd cpu`;
        if(sh){
            if(c.m==fM)e.classList.add('hl');
            if(i<3)e.style.border="2px solid var(--a)";
            e.innerHTML=`<div class="ml">${c.m}</div><div class="tl">${c.t}</div>`;
        } else e.style.background="#444";
        chD.appendChild(e);
    });
}

// 引き直しの処理
function draw(){
    if(end||red||!sId.size) return;
    console.log("--- 引き直し実行 ---");
    console.log("捨てるカード数:", sId.size);

    pH=pH.filter(c=>!sId.has(c.id));
    while(pH.length<5){ rep(); pH.push(d.pop()); }

    red=1;
    document.getElementById('r-btn').disabled=1;
    sId.clear();
    console.log("新しい手札:", pH);

    ren(0); upd(); msg("引き直しました。勝負する3枚を選んでね！");
}

// 役の判定
function judge(cs){
    const ms=cs.map(c=>c.m), ts=cs.map(c=>c.t), same=ms.every(m=>m==ms[0]), lc=ts.filter(t=>t=='light').length, te=ts.filter(t=>t=='tane').length, tn=ts.filter(t=>t=='tan').length, kc=ts.filter(t=>t=='kasu').length, fm=ms.filter(m=>m==fM).length;
    let r={r:"D",n:"役なし",d:0,p:0,b:(fm>0&&fm<3)?fm:0};

    if(same&&ms[0]==fM) r={r:"SSS",n:"月下無双",d:10,p:1,b:0};
    else if(lc==3) r={r:"S",n:"三光",d:6,b:r.b};
    else if(cs.some(c=>c.m==10&&c.t=='tane')&&cs.some(c=>c.m==7&&c.t=='tane')&&cs.some(c=>c.m==6&&c.t=='tane')) r={r:"A",n:"猪鹿蝶",d:5,b:r.b};
    else if(cs.some(c=>c.m==1&&c.t=='light')&&cs.some(c=>c.m==2&&c.t=='tane')&&cs.some(c=>c.m==3&&c.t=='light')) r={r:"A",n:"表菅原",d:5,b:r.b};
    else if(tn==3&&([1,2,3].every(m=>ms.includes(m))||[6,9,10].every(m=>ms.includes(m)))) r={r:"A",n:"短冊役",d:5,b:r.b};
    else if(cs.some(c=>c.m==3&&c.t=='light')&&cs.some(c=>c.m==9&&c.t=='tane')) r={r:"B",n:"花見酒",d:4,b:r.b};
    else if(cs.some(c=>c.m==8&&c.t=='light')&&cs.some(c=>c.m==9&&c.t=='tane')) r={r:"B",n:"月見酒",d:4,b:r.b};
    else if(same) r={r:"B",n:"三つ揃い",d:3,b:0};
    else if(te==3||tn==3) r={r:"B",n:"三丁",d:3,b:r.b};
    else if(te>=2||tn>=2) r={r:"C",n:"繋ぎ",d:2,b:r.b};
    else if(kc==3) r={r:"D",n:"カス",d:1,b:r.b};

    return r;
}

// 攻撃処理
async function atk(){
    if(sId.size!=3||end) return;
    console.log("=== 勝負開始 ===");

    const ab=document.getElementById('a-btn'), rb=document.getElementById('r-btn');
    ab.disabled=rb.disabled=1;

    cH.sort((a,b)=>(a.m==fM?-1:1));
    const pCs=pH.filter(c=>sId.has(c.id)), cCs=cH.slice(0,3);

    ren(1);
    const pR=judge(pCs), cR=judge(cCs);
    const pT=pR.d+pR.b, cT=cR.d+cR.b;

    console.log("プレイヤー役:", pR.n, "基本:", pR.d, "舞台ボーナス:", pR.b, "合計:", pT);
    console.log("CPU役:", cR.n, "基本:", cR.d, "舞台ボーナス:", cR.b, "合計:", cT);

    let dC=pR.p?pR.d:Math.max(0,pT-cT), dP=cR.p?cR.d:Math.max(0,cT-pT);

    console.log(`ダメージ計算結果 -> CPUへ:${dC} / YOUへ:${dP}`);

    msg(`${pR.n}(${pT}) vs ${cR.n}(${cT})<br>CPUに ${dC} ダメージ！`);
    cHP-=dC; upd();

    if(cHP<=0){
        console.log("結果: プレイヤーの勝利！");
        finish("勝ち！"); return;
    }

    await new Promise(r=>setTimeout(r,1200));
    pHP-=dP; upd();
    msg(`${pR.n} vs ${cR.n}<br>${dP} の反撃を受けた！`);

    if(pHP<=0){
        console.log("結果: CPUの勝利...");
        finish("負け..."); return;
    }

    await new Promise(r=>setTimeout(r,1200));
    rep(); pH=[]; cH=[];
    for(let i=0;i<5;i++){ rep(); pH.push(d.pop()); cH.push(d.pop()); }

    red=0; ab.disabled=0; rb.disabled=0; sId.clear();
    console.log("--- ターン終了 / 次ターン準備完了 ---");
    ren(0); upd(); msg("次ターン");
}

// UI更新
function upd() {
    document.getElementById('chp-v').innerText=Math.max(0,cHP);
    document.getElementById('php-v').innerText=Math.max(0,pHP);
    document.getElementById('chp-f').style.width=Math.max(0,cHP/20*100)+"%";
    document.getElementById('php-f').style.width=Math.max(0,pHP/20*100)+"%";
    document.getElementById('dc').innerText=d.length;
}

function msg(m){
  document.getElementById('log').innerHTML=m;
}

function finish(m){
  end=1; msg(`<b style="color:var(--g);font-size:1.4rem">${m}</b>`);
}


function toggleRule() {
    const modal = document.getElementById('rule-modal');
    // 現在の表示状態（CSSのdisplay）を見て切り替える
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        console.log("役一覧を閉じました");
    } else {
        modal.style.display = 'flex';
        console.log("役一覧を開きました");
    }
}

init();

