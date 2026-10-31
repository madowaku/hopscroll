// Journey text in Japanese and English. Moon Lab stays Japanese (its tests read the JA legend).
const STRINGS={
 ja:{
  start:'はじめる',next:'次へ',again:'もう一度、月の庭へ',retry:'もう一度',retryMark:'☾ 月印から再挑戦',restart:'最初から',
  resume:'つづける',resumeButton:'▶ つづける',pause:'ひと休み',helpTitle:'指一本で、着地点を選ぶ',
  help:'押すとFAST、離すとSLOW。薄藤の月光橋は離して、金の流星橋は押したまま着地。団子の島に降りると団子をもらえる。',
  clear:'STAGE CLEAR',full:'FULL MOON!',
  festival:n=>n?`地球見祭に、団子が${n}つ届いた。`:'地球見祭に、たどりついた。',
  dangoGot:'団子をひとつ手に入れた！地球見祭へ持っていこう。',dangoMissed:'金の輪の島に降りると、団子がもらえる。',
  bridgeIntro:'着地する速さで、橋が変わる。',
  fail:{'quiet-bridge-fast':['橋が消えた！','着地の前に指を離そう。'],'meteor-bridge-slow':['流星橋が消えた！','押したまま着地しよう。'],undershoot:['届かなかった！','FASTを長めに。'],overshoot:['飛び越した！','少し早く離そう。'],edge:['端に落ちた！','輪を足場の中へ。'],other:['落ちちゃった！','着地点を見直そう。']},
  cueFast:'画面を押す → FAST',cueSlow:'離す → SLOW',dangoPop:'+団子',
  practiceHold:'画面を長押ししてみよう',practiceHoldSub:'押している間はステージが速く進み、遠くに着地する',practiceRelease:'指を離すと、ゆっくり進む',practiceReleaseSub:'着地点の輪が近くに戻るよ',practiceGood:'いいね！その調子',
  titleStart:'START',titleSelect:'STAGE SELECT',subtitle:'Moon Rabbit Journey',
  lang:'EN',langLabel:'Switch to English',
  pauseLabel:'一時停止',muteLabel:'効果音をミュート',unmuteLabel:'効果音をオン',helpLabel:'遊び方',homeLabel:'タイトルへ',
  holdLabel:'押している間はFAST、離すとSLOW。画面のどこを押してもよい',
  stage:(l,state)=>`Stage ${l.id} ${l.title}${state==='full'?'（FULL MOON）':state?'（クリア）':''}`,
  canvas:'自動で跳ぶ月兎。青白い道へ着地。薄藤の橋は指を離して着地すると安全。輪は次の着地点、赤は危険、金は団子。',
  hintPlay:'輪は今の速度のまま跳んだ着地点。赤は危険、金は団子の島。',hintReady:'輪は今の速度のまま跳んだ着地点。',
  checkpointReady:'次の着地点を確認。最初はSLOWで安全。',
  checkpointUsed:'月印から再開中',checkpointPassed:'月印を通過',dangoHud:'団子を獲得',
  levels:{}
 },
 en:{
  start:'Start',next:'Next',again:'Back to the Moon Garden',retry:'Try again',retryMark:'☾ Retry from the moon mark',restart:'From the start',
  resume:'Continue',resumeButton:'▶ Continue',pause:'Taking a breath',helpTitle:'One finger picks the landing',
  help:'Hold for FAST, release for SLOW. Land on lilac moon bridges released and on gold meteor bridges still holding. Land on the dango isle to get dango.',
  clear:'STAGE CLEAR',full:'FULL MOON!',
  festival:n=>n?`${n} dango reached the Earthwatch festival.`:'You reached the Earthwatch festival.',
  dangoGot:'You got a dango! Bring it to the Earthwatch festival.',dangoMissed:'Land on the gold-ring isle to get a dango.',
  bridgeIntro:'How fast you land changes the bridge.',
  fail:{'quiet-bridge-fast':['The bridge vanished!','Let go before you land.'],'meteor-bridge-slow':['The meteor bridge faded!','Keep holding as you land.'],undershoot:['Too short!','Hold FAST a little longer.'],overshoot:['Overshot!','Let go a bit sooner.'],edge:['Off the edge!','Put the ring on the path.'],other:['You fell!','Check the landing ring.']},
  cueFast:'Press the screen → FAST',cueSlow:'Release → SLOW',dangoPop:'+Dango',
  practiceHold:'Press and hold the screen',practiceHoldSub:'While you hold, the stage rushes by and you land farther',practiceRelease:'Let go to slow down',practiceReleaseSub:'The landing ring comes back closer',practiceGood:'Nice! You got it',
  titleStart:'START',titleSelect:'STAGE SELECT',subtitle:'Moon Rabbit Journey',
  lang:'日本語',langLabel:'日本語に切り替え',
  pauseLabel:'Pause',muteLabel:'Mute sound',unmuteLabel:'Unmute sound',helpLabel:'How to play',homeLabel:'Back to title',
  holdLabel:'Hold anywhere for FAST, release for SLOW',
  stage:(l,state)=>`Stage ${l.id} ${l.title}${state==='full'?' (FULL MOON)':state?' (cleared)':''}`,
  canvas:'A moon rabbit hops by herself. Land on the pale blue paths. Moon bridges hold only released landings. The ring is the next landing: red is danger, gold is dango.',
  hintPlay:'The ring is where this hop lands at the current speed. Red is danger, gold is the dango isle.',hintReady:'The ring is where this hop lands at the current speed.',
  checkpointReady:'Check the landing ring. The first hop is safe at SLOW.',
  checkpointUsed:'Restarted from the moon mark',checkpointPassed:'Moon mark reached',dangoHud:'Dango collected',
  levels:{
   '001':['Moon Garden','Carry the dango to the moon road.'],
   '002':['Hall of Night Wind','Go far — but not too far.'],
   '003':['Quiet Moon Bridge','Move fast, let go, and the bridge appears.'],
   '004':['Two Moon Roads','Different rhythms, same place.'],
   '005':['Earthwatch Night','Carry the dango to the light of the Earth.'],
   '006':['Meteor Sea','Land while still FAST, and the meteors become a path.']
  }
 }
};
const KEY='hopscroll-lang';
export function createI18n(fixed){
 let lang=fixed;
 if(!lang){try{lang=localStorage.getItem(KEY);}catch{}}
 if(lang!=='ja'&&lang!=='en')lang=(navigator.language||'ja').toLowerCase().startsWith('ja')?'ja':'en';
 return {
  get lang(){return lang;},
  t(key){return STRINGS[lang][key];},
  level(l){const tr=STRINGS[lang].levels[l.id];return tr?{...l,title:tr[0],subtitle:tr[1]}:l;},
  toggle(){lang=lang==='ja'?'en':'ja';try{localStorage.setItem(KEY,lang);}catch{}document.documentElement.lang=lang;return lang;},
  apply(){document.documentElement.lang=lang;}
 };
}
