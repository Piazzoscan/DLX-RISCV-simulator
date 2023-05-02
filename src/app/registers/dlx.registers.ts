import {Registers} from './registers';

export class DLXRegisters extends Registers {

  r: [0, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number, number];

  rBold: [any, string, string, string, string, string, string, string, string, string,
    string, string, string, string, string, string, string, string, string, string,
    string, string, string, string, string, string, string, any, string, string, string];

  previous_register: number;

  iar: number;
  mar: number;
  ir: number;
  temp: number;
  mdr: number;
  ien: number;
  a: number;
  b: number;
  c: number;

  marBold : string;
  mdrBold : string;
  iarBold : string;
  ienBold : string;

  constructor() {
    super();
    this.r = [0, Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296), Math.floor(Math.random()*4294967296),
      Math.floor(Math.random()*4294967296)];

    this.rBold = ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal',
    'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal',
    'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal'];

    this.previous_register = 0;

    this.iar = 0;
    this.mar = 0;
    this.ir = 0;
    this.temp = 0;
    this.mdr = 0;
    this.a = 0;
    this.b = 0;
    this.ien = 0;

    this.marBold = 'normal';
    this.mdrBold = 'normal';
    this.iarBold = 'normal';
    this.ienBold = 'normal';
  }

  public setBold(registroNum : number){

    this.rBold[this.previous_register] = 'normal';
    this.previous_register = registroNum;

    if(registroNum > 0)
      this.rBold[registroNum] = 'bold';
  }

  public resetBoldReg(){
    this.marBold = 'normal';
    this.mdrBold = 'normal';
    this.iarBold = 'normal';
    // this.ienBold = 'normal';
  }
  public setBoldMar(){
    this.marBold = 'bold';
  }

  public setBoldMdr(){
    this.mdrBold = 'bold';
  }

  public setBoldIar(){
    this.iarBold = 'bold';
  }

  public setBoldIen(){
    this.ienBold = 'bold';
  }

  public resetBoldIen(){
    this.ienBold = 'normal'
  }
}
