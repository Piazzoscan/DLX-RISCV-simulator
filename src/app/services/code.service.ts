import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Interpreter } from '../interpreters/interpreter';

@Injectable({
  providedIn: 'root'
})
export class CodeService {

  public content: string;
  public interpreter: Interpreter;
  public editorMode: string;

  constructor(private dialog: MatDialog) {

  }

  load() {
    this.content = window.localStorage.getItem(`code-${this.editorMode}`) ||
      (this.editorMode == 'dlx' ?
        "init: \t\tLHI R30, 0x4000\t\t\t\t; set R30 = 0x40000000h\n" +
        "\t\t\tSW R29, 0x0000(R30)\t\t\t; save R29 in 0x40000000h (RAM)\n" +
        "\t\t\tSW R28, 0x0004(R30)\t\t\t; save R28 in 0x40000004h (RAM)\n" +
        "\t\t\tLHI R29, 0XC000\t\t\t\t; set R29 = 0xC0000000h (STARTUP address)\n" +
        "\t\t\tLBU R28, 0x0000(R29)\t\t; read STARTUP signal into R28\n" +
        "\t\t\tBEQZ R28, handler\t\t\t; if STARTUP == 0 then jump to (interrupt) handler\n" +
        "\t\t\tSB R0, 0x0004(R29)\t\t\t; set STARTUP = 0\n" +
        "\t\t\tJ main\t\t\t\t\t\t; jump to main:\n" +
        "handler:" +
        "\tLHI R29, 0x3000\t\t\t\t; set R29 = 0x30000000h (INPUT_PORT address)\n"+
        "\t\t\tLBU R28, 0x0004(R29)\t\t; read interrupt INPUT_PORT signal into R28\n" +
        "\t\t\tBNEZ R28, input_port\t\t; if INT_I == 0 then jump to (interrupt) input_port\n" +
        "\t\t\tLHI R29, 0x9000\t\t\t\t; set R29 = 0x90000000h (LED address)\n"+
        "\t\t\tSB R0, 0x0004(R29)\t\t\t; switch LED signal\n" +
        "\t\t\tLW R28, 0x0004(R30)\t\t\t; restore R28 value from memory (RAM)\n" +
        "\t\t\tLW R29, 0x0000(R30)\t\t\t; restore R29 value from memory (RAM)\n" +
        "\t\t\tRFE\n" +
        "\n\t\t\t\t\t\t\t\t\t\t; Fibonacci sequence\n" +
        "main:\t\tADDI R1,R0,0x0000\t\t\t; set R1 = 0\n" +
        "\t\t\tADDI R2,R0,0x0001\t\t\t; set R2 = 1\n" +
        "\t\t\tADDI R3,R0,0x0001\t\t\t; set R3 = 1\n" +
        "\t\t\tADDI R4,R0,0x0014\t\t\t; set counter R4 = 0x14\n" +
        "loop:\t\tADD R1,R2,R0\t\t\t\t; copy R2 into R1\n" +
        "\t\t\tADD R2,R3,R0\t\t\t\t; copy R3 into R2\n" +
        "\t\t\tADD R3,R2,R1\t\t\t\t; R3 = R2 + R1\n" +
        "\t\t\tSUBI R4,R4,0x0001\t\t\t; decrease R4 by 1\n" +
        "\t\t\tBEQZ R4,main\t\t\t\t; Jump to main if R4 == 0\n" +
        "\t\t\tJ loop\t\t\t\t\t\t; Jump to loop:\n" +
        "\ninput_port:\tLBU R20, 0x0000(R29)\t\t; read data from input_port (CS_READ_PORT address)\n" +
        "\t\t\tRFE\n"
        : 'main: ')
      ;
  }

  save(fileName: string) { // saves the code locally on a file
    window.localStorage.setItem(`code-${this.editorMode}`, this.content);
    var text = this.content;
    var blob = new Blob([text], { type: "text/plain"});
    var anchor = document.createElement("a");
    anchor.download = fileName;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.target ="_blank";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  browserSave(){  // saves the code in browser local storage
    window.localStorage.setItem(`code-${this.editorMode}`, this.content);
  }

  clear() {
    window.localStorage.removeItem(`code-${this.editorMode}`);
  }

  encode(lineN: number): number {
    return this.interpreter.encode(this.content.split('\n')[lineN]);
  }
}
