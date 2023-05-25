import {ApplicationRef, Input} from '@angular/core';

/*
export interface IDiagram{
  new(animationDuration: number, running: boolean, paused: boolean, type: string, loop:boolean, injector: Injector): Diagram;
}*/

export class Diagram{

  type: string; //indica il tipo di diagramma
  running: boolean; //indica lo stato dell'animazione, se sta scorrendo oppure no
  paused: boolean; //indica se l'animazione è stata messa in pausa
  animationClass: string; //indica la classe dell'animazione
  animationDuration: number; //velocità di scorrimento
  appRef: ApplicationRef;

  constructor(type: string, animationClass: string, appRef: ApplicationRef) {
    this.type = type;
    this.running = false;
    this.paused = false;
    this.animationClass = animationClass;
    this.animationDuration = 4000;
    this.appRef = appRef;
  }

  /*METODI GETTER */
  public getType(){
    return this.type;
  }

  public isRunning(){
    return this.running;
  }

  public isPaused(){
    return this.paused;
  }

  public getAnimationClass(){
    return this.animationClass;
  }

  public getAnimationDuration(){
    return this.animationDuration;
  }

  /*METODI SETTER*/
  public setType(type: string){
    if(type != ''){
        this.type = type;
    }
  }

  private setRunning(running: boolean){
    this.running = running;
  }

  private setPaused(paused: boolean){
    this.paused = paused;
  }

  private setAnimationClass(animationClass: string){
    if(animationClass != "")
      this.animationClass = animationClass;
  }

  public setAnimationDuration(animationDuration: number){
    //controllo
    if(animationDuration > 0){
        this.animationDuration = animationDuration;
    }
  }

  /*METODI PER IL CONTROLLO DELLE ANIMAZIONI */

  /*Per mettere in pausa l'animazione*/
  public pause(){
    this.setPaused(true);
  }

  /*Per far partire l'animazione*/
  public start(){
    if(this.isPaused()){
      this.setPaused(false);
    }
    this.setRunning(true);
  }

  /*Per riprendere l'animazione*/
  public resume(){
    if(this.isPaused()){
      this.setPaused(false);
    }
  }

  /*Per fare lo stop dell'animazione*/
  public stop(){
    this.setRunning(false);
    this.setPaused(false);
    //setto la classe a 'none'
    this.setAnimationClass("none");
    //triggero il refresh
    this.appRef.tick();
    //rimetto la classe giusta
    this.setAnimationClass(this.getAnimationClassFromType());
  }

  /*Metodo che ritorna la classe dell'animazione in base al tipo*/
  private getAnimationClassFromType(){
    if(this.getType() === 'clock') return 'clock';
    else return 'general';
  }

  /*Metodo che ritorna il nome dell'immagine del componente */
  public getImageName() {
    return ("assets/img/diagram/"+this.getType()+".png");
  }

  public getPlayState(){
    if(!this.isPaused() && this.isRunning())
      return 'running';
    else return 'paused';
  }
}
