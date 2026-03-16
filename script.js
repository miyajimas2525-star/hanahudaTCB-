//d=山札, pHP/cHP=体力, fM=舞台月, pH/cH=手札, sId=選択ID, end=終了フラグ, red=引直済フラグ
let d=[],pHP=20,cHP=20,fM=1,pH=[],cH=[],sId=new Set(),end=0,red=0;

//山札の補充

function rep(){
    if(d.length<10){
        console.log("---山札を補充します---");
        const n=[];
        //月ごとのカード構成(1月〜12月)
        //花札の標準的な枚数構成(光/種/短/カスの内訳)を配列で管理
        const mt=[
            ['light','tan','kasu','kasu'], //1月(松)
            ['tane','tan','kasu','kasu'],  //2月(梅)
            ['light','tan','kasu','kasu'], //3月(桜)
            ['tane','tan','kasu','kasu'],  //4月(藤)
            ['tane','tan','kasu','kasu'],  //5月(菖蒲)
            ['tane','tan','kasu','kasu'],  //6月(牡丹)
            ['tane','tan','kasu','kasu'],  //7月(萩)
            ['light','tane','kasu','kasu'],//8月(月)
            ['tane','tan','kasu','kasu'],  //9月(菊)
            ['tane','tan','kasu','kasu'],  //10月(紅葉)
            ['light','tane','tan','kasu'], //11月(柳)
            ['light','kasu','kasu','kasu'] //12月(桐)
        ];


        for(let m=1;m<=12;m++){

            for(let i=0;i<4;i++){
                n.push({
                    //月と連番を組み合わせてIDにして重複するのを防止する
                    id:`${m}-${i}`,
                    m:m, //月(1-12)
                    t:mt[m-1][i] //定義した配列から札の種類を割り当てる
                });
            }
        }

        d=[...d,...n.sort(()=>Math.random()-.5)];
        console.log("補充後の山札枚数:",d.length);
    }
}

//ゲーム開始
function init(){
    console.log("===ゲームをリセットします===");
    pHP=cHP=20;
    end=red=0;
    fM=Math.floor(Math.random()*12)+1;
    const mn=["","松","梅","桜","藤","菖","牡丹","萩","月","菊","紅葉","柳","桐"];

    console.log(`今回の舞台月:${fM}(${mn[fM]})`);

    document.getElementById('fm-n').innerText=`${fM}(${mn[fM]})`;
    d=[];
    rep();
    pH=[];
    cH=[];
    for(let i=0;i<5;i++){
       pH.push(d.pop());
       cH.push(d.pop());
     }

    console.log("プレイヤー手札:", pH);
    console.log("CPU手札:", cH);

    sId.clear();
    ren(0);
    upd();
    document.getElementById('r-btn').disabled=0;
    msg("ゲーム開始！");
}

//描画
function ren(sh){
    const phD=document.getElementById('p-h'),chD=document.getElementById('c-h');
    phD.innerHTML='';
    chD.innerHTML='';
    pH.forEach(c=>{
        const e=document.createElement('div');
      e.className=`cd ${sId.has(c.id) ? 'sel' : ''} ${c.m == fM ? 'hl' : ''}`;
        e.innerHTML=`<div class="ml">${c.m}</div><div class="tl">${c.t}</div>`;
        e.onclick=()=>{
            if(!end){
                sId.has(c.id)?sId.delete(c.id):sId.add(c.id);
                console.log("選択中のカードID:",Array.from(sId));
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
        }else e.style.background="#444";
        chD.appendChild(e);
    });
}

//引き直しの処理
function draw(){
    if(end||red||!sId.size){
    return;
  }
    console.log("---引き直し実行---");
    console.log("捨てるカード数:",sId.size);

    pH=pH.filter(c=>!sId.has(c.id));

    while(pH.length<5){
      rep();
      pH.push(d.pop());
    }

    red=1;
    document.getElementById('r-btn').disabled=1;
    sId.clear();
    console.log("新しい手札:",pH);

    ren(0);
    upd();
    msg("引き直しました。勝負する3枚を選んでね！");
}

//役の判定処理
function judge(cs){
    //判定に必要な変数の整理（月、種類、重複チェックなど）
    const ms=cs.map(c=>c.m);
    const ts=cs.map(c=>c.t);
    const same=ms.every(m=>m==ms[0]); // 全て同じ月か
    const lc=ts.filter(t=>t=='light').length; // 光札の数
    const te=ts.filter(t=>t=='tane').length;  // 種札の数
    const tn=ts.filter(t=>t=='tan').length;   // 短冊の数
    const kc=ts.filter(t=>t=='kasu').length;  // カスの数
    const fm=ms.filter(m=>m==fM).length;      // 舞台月と一致する札の数

    //初期値（役なし）の設定
    let r={r:"D",n:"役なし",d:0,p:0,b:(fm>0&&fm<3)?fm:0};

    //役の判定：上から順に優先度の高い役をチェック
    if(same&&ms[0]==fM){
        //3枚全てが舞台月
        r={r:"SSS",n:"月下無双",d:10,p:1,b:0};
    }else if(lc==3){
        //光札が3枚
        r={r:"S",n:"三光",d:6,b:r.b};
    }else if(
        cs.some(c=>c.m==10&&c.t=='tane')&&
        cs.some(c=>c.m==7&&c.t=='tane')&&
        cs.some(c=>c.m==6&&c.t=='tane')
    ){
        //萩・牡丹・紅葉の種
        r={r:"A",n:"猪鹿蝶",d:5,b:r.b};
    }else if(
        cs.some(c=>c.m==1&&c.t=='light')&&
        cs.some(c=>c.m==2&&c.t=='tane')&&
        cs.some(c=>c.m==3&&c.t=='light')
    ){
        //松の光・梅の種・桜の光
        r={r:"A",n:"表菅原",d:5,b:r.b};
    }else if(tn==3&&([1,2,3].every(m=>ms.includes(m))||[6,9,10].every(m=>ms.includes(m)))){
        //赤短（松・梅・桜）または青短（牡丹・菊・紅葉）
        r={r:"A",n:"短冊役",d:5,b:r.b};
    }else if(cs.some(c=>c.m==3&&c.t=='light')&&cs.some(c=>c.m==9&&c.t=='tane')){
        //桜の光・菊の種
        r={r:"B",n:"花見酒",d:4,b:r.b};
    }else if(cs.some(c=>c.m==8&&c.t=='light')&&cs.some(c=>c.m==9&&c.t=='tane')){
        //ススキの光・菊の種
        r={r:"B",n:"月見酒",d:4,b:r.b};
    }else if(same){
        //月が3枚揃う（舞台月以外）
        r={r:"B",n:"三つ揃い",d:3,b:0};
    }else if(te==3||tn==3){
        //種または短冊が3枚
        r={r:"B",n:"三丁",d:3,b:r.b};
    }else if(te>=2||tn>=2){
        //種または短冊が2枚
        r={r:"C",n:"繋ぎ",d:2,b:r.b};
    }else if(kc==3){
        //カスが3枚
        r={r:"D",n:"カス",d:1,b:r.b};
    }

    return r;
}

//攻撃の処理
async function atk(){
    if(sId.size!=3||end){
       return;
     }

    console.log("===勝負開始===");

    const ab=document.getElementById('a-btn'),rb=document.getElementById('r-btn');
    ab.disabled=rb.disabled=1;

    cH.sort((a,b)=>(a.m==fM?-1:1));
    const pCs=pH.filter(c=>sId.has(c.id)),cCs=cH.slice(0,3);

    ren(1);
    const pR=judge(pCs),cR=judge(cCs);
    const pT=pR.d+pR.b,cT=cR.d+cR.b;

    console.log("プレイヤー役:",pR.n,"基本:",pR.d,"舞台ボーナス:",pR.b,"合計:",pT);
    console.log("CPU役:",cR.n,"基本:",cR.d,"舞台ボーナス:",cR.b,"合計:",cT);

    let dC=pR.p?pR.d:Math.max(0,pT-cT),dP=cR.p?cR.d:Math.max(0,cT-pT);

    console.log(`ダメージ計算結果->CPUへ:${dC}/YOUへ:${dP}`);

    msg(`${pR.n}(${pT})vs${cR.n}(${cT})<br>CPUに${dC}ダメージ！`);
    cHP-=dC;
    upd();

    if(cHP<=0){
        console.log("結果:プレイヤーの勝利！");
        fin("勝ち！");
        return;
    }

    await new Promise(r=>setTimeout(r,1200));
    pHP-=dP;
    upd();
    msg(`${pR.n}vs${cR.n}<br>${dP}の反撃を受けた！`);

    if(pHP<=0){
        console.log("結果:CPUの勝利...");
        fin("負け..."); return;
    }

    await new Promise(r=>setTimeout(r,1200));
    rep();
    pH=[];
    cH=[];

    for(let i=0;i<5;i++){
      rep();
      pH.push(d.pop());
      cH.push(d.pop());
    }

    red=0;
    ab.disabled=0;
    rb.disabled=0;
    sId.clear();

    console.log("---ターン終了/次ターン準備完了---");

    ren(0);
    upd();
    msg("次ターン");
}

//UI更新
function upd(){
    document.getElementById('chp-v').innerText=Math.max(0,cHP);
    document.getElementById('php-v').innerText=Math.max(0,pHP);
    document.getElementById('chp-f').style.width=Math.max(0,cHP/20*100)+"%";
    document.getElementById('php-f').style.width=Math.max(0,pHP/20*100)+"%";
    document.getElementById('dc').innerText=d.length;
}
function msg(m){
  document.getElementById('log').innerHTML=m;
}
function fin(m){
  end=1; msg(`<b style="color:var(--g);font-size:1.4rem">${m}</b>`);
}

//tgl:遊び方/訳の開閉
function tgl(){
    const m = document.getElementById('rule-modal');
    m.style.display=(m.style.display==='flex')?'none':'flex';
}

//tab:タブ切替
function tab(id){
    document.querySelectorAll('.tab-body').forEach(el=>el.style.display='none');
    const target = document.getElementById(id);
    if(target){
      target.style.display='block';
  }
}



init();
