//>>built
define("demos/flashCards/src/MathFlashCard",["dojo","dijit","dojox","dojo/require!dijit/_Widget,dijit/_Templated"],function(_1,_2,_3){_1.provide("demos.flashCards.src.MathFlashCard");_1.require("dijit._Widget");_1.require("dijit._Templated");_1.declare("dojofun.widget.MathFlashCard",[_2._Widget,_2._Templated],{numberProblems:20,minInt:0,maxInt:10,timer:15,betweenTime:5,problemType:"addition",currentProblem:0,correctAnswers:0,incorrectAnswers:0,problemSet:null,started:false,tooSlow:0,templateString:"<div>\n\t<table width=\"100%\">\n\t\t<tr>\n\t\t\t<td dojoAttachPoint=\"topL\"></td>\n\t\t\t<td dojoAttachPoint=\"topR\"></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td dojoAttachPoint=\"bottomL\"></td>\n\t\t\t<td dojoAttachPoint=\"bottomR\"></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td colspan=\"2\" class=\"dividerLine\"></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td dojoAttachPoint=\"answer\" colspan=2 class=\"answerWrap\">\n\t\t\t\t<input dojoAttachPoint=\"answerInput\" class=\"answerInput\">\n\t\t\t</td>\n\t\t</tr>\n\t</table>\n</div>",generateProblemSet:function(){var _4=[];if(this.problemType=="addition"){for(var i=0;i<this.numberProblems;i++){_4.push({x:Math.floor(Math.random()*(this.maxInt+1)),y:Math.floor(Math.random()*(this.maxInt+1)),type:"addition"});}}return _4;},restart:function(){this.problemSet=this.generateProblemSet();_1.forEach(["currentProblem","correctAnswers","incorrectAnswers","tooSlow"],function(_5){this[_5]=0;},this);this.renderProblem(0);this.getStarted();},renderProblem:function(_6){this.topR.innerHTML=this.problemSet[_6].x;this.bottomR.innerHTML=this.problemSet[_6].y;this.answerInput.value="";if(this.problemSet[_6].type=="addition"){this.bottomL.innerHTML="+";}if(this.started){this.getStarted();}},getStarted:function(){_1.style(this.domNode,"opacity",100);this.fadeOp=_1.fadeOut({node:this.domNode,duration:(this.timer*1000),onEnd:_1.hitch(this,"onTooSlow")}).play();if(!this.started){this.started=true;var _7=_1.hitch(_2,"focus",this.answerInput);this.connect(this.answerInput,"onblur",function(){setTimeout(_7,10);});setTimeout(_7,10);this.listenForKeyEvents();}},listenForKeyEvents:function(){this.onKeyDownEvent=this.connect(_1.doc,"onkeydown",function(e){var _8=e.keyCode||e.charCode;var k=_1.keys;switch(_8){case k.ENTER:if(this.checkAnswer()){this.onCorrect();}else{this.onIncorrect();}break;}});},stopListening:function(){this.disconnect(this.onKeyDownEvent);delete this.onKeyDownEvent;},checkAnswer:function(){var _9=this.problemSet[this.currentProblem];if(_9.type=="addition"){var _a=_9.x+_9.y;}if(_a&&this.answerInput.value==_a){return true;}},onCorrect:function(){this.correctAnswers++;this.fadeOp.stop();delete this.fadeOp;if((this.currentProblem+1)<this.problemSet.length){this.renderProblem(++this.currentProblem);}else{this.onEnd(this.correctAnswers,this.problemSet.length,this.tooSlow);}},onIncorrect:function(){this.incorrectAnswers++;this.fadeOp.stop();delete this.fadeOp;if((this.currentProblem+1)<this.problemSet.length){this.renderProblem(++this.currentProblem);}else{this.onEnd(this.correctAnswers,this.problemSet.length,this.tooSlow);}},onTooSlow:function(){this.tooSlow++;if((this.currentProblem+1)<this.problemSet.length){this.renderProblem(++this.currentProblem);}else{this.onEnd(this.correctAnswers,this.problemSet.length,this.tooSlow);}},onEnd:function(_b,_c,_d){this.stopListening();this.started=false;},postCreate:function(){this.problemSet=this.generateProblemSet();this.renderProblem(0);}});});