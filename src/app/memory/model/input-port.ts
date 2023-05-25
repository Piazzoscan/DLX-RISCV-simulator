import { Injector, Input, Inject, Injectable } from "@angular/core";
import { LogicalNetwork } from "./logical-network";
import { MemoryService } from "src/app/services/memory.service";

export class InputPort extends LogicalNetwork {
  @Input() memoryService: MemoryService;

  data: number; //dato fornito dalla input port
  size_port: number; //formato della porta 8 16 32 bit
  int_a: boolean; //int_a = 0 oppre int_a = 1 => interrupt generato dalla porta di input

  constructor(min_address: number, max_address: number,injector: Injector) {
    super("INPUT_PORT", min_address, max_address);
    super.devType = "IPort";
    this.clkType = "MEMRD*";
    this.cs = [];
    this.data = 0; //poi generemo un numero random
    this.size_port = 8; //default 8 bit
    this.int_a = false;
    this.setCS("CS_INPUT_PORT", this.min_address, 0); // effettuando lettura a questo cs si ottiene il valore generato dalla ports in input
    this.setCS("CS_READ_INT_INPUT_PORT", this.min_address + 0x00000001, 1); //leggo se l'interrup è stato generato dalla porta
  }

  public getImageName() {
    return ("assets/img/input-port/input_port_bit_"+this.size_port+".jpg").toLowerCase();

  }

  public getData() {
    return this.data;
  }

  setInterrupt(){
    this.int_a = true;
  }

  generateData() {
    let max = Math.pow(2,this.size_port);
    this.data = Math.floor(Math.random() * max);
  }

  public load(address: number, instrType?: string): number {
    let cs = this.cs.find((el) => el.address == address);
    if (this.clkType == "MEMWR*") console.log("clk è MEMWR*");

    switch (cs.id) {
      case "CS_READ_INT_INPUT_PORT":
        return this.int_a ? 1 : 0;
      case "CS_INPUT_PORT":
        if(this.clkType == "MEMRD*"){
          this.int_a = false;
          this.generateData();
          this.setCS("CS_INPUT_PORT",this.min_address,this.data);
          return this.getData();
        }
    }
    return 0;
  }
}
