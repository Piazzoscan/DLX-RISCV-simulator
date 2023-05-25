import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '../dialogs/message-dialog.component';
import { MemoryService } from '../services/memory.service';
import { Device } from './model/device';
import { LogicalNetwork } from './model/logical-network';
import { LogicalNetworkDialogComponent } from '../dialogs/logical-network-dialog.component';
import { MemoryAddressDialogComponent } from '../dialogs/memory-address-dialog.component';
import { LedLogicalNetwork } from './model/led.logical-network';
import { FFDLogicalNetwork } from './model/ffd-logical-network';
import { ImageDialogComponent } from '../dialogs/image-dialog.component';
import { ErrorDialogComponent } from '../dialogs/error-dialog.component';
import { InstructionDialogComponent } from '../dialogs/instruction-dialog.component';
import { isUndefined } from 'util';
import { Counter } from './model/counter';
import { CounterDialogComponent } from '../dialogs/counter-dialog.component';
import { instructions } from '../interpreters/dlx/dlx.instructions';
import { InputPort } from './model/input-port';
import { InputPortDialogComponent } from '../dialogs/input-port-dialog.component';

@Component({
  selector: 'app-memory',
  templateUrl: './memory.component.html',
  styleUrls: ['./memory.component.sass'],
  animations: [
    trigger('showHideTrigger', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('200ms ease-out', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ transform: 'translateY(-100%)' }))
      ])
    ])
  ],
})

export class MemoryComponent implements OnInit {
  inputAddr: any;
  selectedCS: { id: string, address: number, hexAddress: string }
  selected: Device;
  @Input() memoryService: MemoryService;
  @Input() counter: Counter;

  get canMoveSelectedLeft(): boolean {
    let devices = this.memoryService.memory.devices;
    let index = devices.indexOf(this.selected);
    return (this.selected.name !== 'EPROM' && this.selected.name != 'RAM_B') &&
      (index > 0);;
  }

  get canMoveSelectedRight(): boolean {
    let devices = this.memoryService.memory.devices;
    let index = devices.indexOf(this.selected);
    return (this.selected.name !== 'EPROM') &&
      (index < devices.length - 1);
  }

  constructor(private dialog: MatDialog) {
  }

  ngOnInit() {

  }

  openDialogImage(n) {
    // console.log(n);
    if(this.selected.isACounter()){
      this.dialog.open(CounterDialogComponent, {
        data: { network: n as Counter}
      });
    } else if(this.selected.isAInputPort()){
      this.dialog.open(InputPortDialogComponent,{
        data: { network: n as InputPort}
      });
    } else {
      this.dialog.open(LogicalNetworkDialogComponent, {
        data: { network: n}
      });
  }
  }

  onAdd() {
    let firstAdd = this.memoryService.memory.firstFreeAddr(0) + 1;
    this.memoryService.add('New', firstAdd, firstAdd + 0x01FFFFFF);
    this.memoryService.save();
  }

  onAddFFD() {
    let firstAdd = this.memoryService.memory.firstFreeAddr(0x20000000) + 1;
    this.memoryService.add(FFDLogicalNetwork, firstAdd, firstAdd + 0x00000001);
    this.memoryService.save();
  }

  onAddLed() {
    let firstAdd = this.memoryService.memory.firstFreeAddr(0x20000000) + 1;
    this.memoryService.add(LedLogicalNetwork, firstAdd, firstAdd + 0x0000003);
    this.memoryService.save();
  }

  onAddCounter() {
    let firstAdd = this.memoryService.memory.firstFreeAddr(0x20000000) + 1;
    this.memoryService.add(Counter, firstAdd, firstAdd + 0x00000014);
    this.memoryService.save();
  }

  onAddInputPort() {
    let firstAdd = this.memoryService.memory.firstFreeAddr(0x20000000) + 1;
    this.memoryService.add(InputPort, firstAdd, firstAdd + 0x00000003);
    this.memoryService.save();
    let device;
    this.memoryService.memory.devices.forEach(dev => {
      if(dev.min_address == firstAdd) {
        device = (dev as InputPort);
        device.updateName(this.memoryService.memory.setNameExt(this.memoryService.memory.Iports.length));
      }
    });
    this.memoryService.memory.Iports.push(device);
  }


  onDelete(dev: Device) {
    if(dev.name.includes("INPUT_PORT"))
      this.memoryService.memory.removePort(dev);
    this.memoryService.remove(dev);
    this.selected = null;
    this.memoryService.save();
  }

  onChangeCS(newValue: string, id: string) {
    let devices = this.memoryService.memory.devices;
    let indexSelectedDevice = this.memoryService.memory.devices.indexOf(this.selected);
    let cs = devices[indexSelectedDevice].cs.find(el => el.id == id);
    if (cs == null) return;
    if (newValue.length == 8) {
      let iv = parseInt(newValue, 16);
      if (iv || iv === 0) {
        cs.address = iv >>> 2;
      }
    }
    cs.hexAddress = newValue;
    console.log(cs);
  }

  onChange(event: any, side: string) {
    let devices = this.memoryService.memory.devices;
    let indexSelectedDevice = this.memoryService.memory.devices.indexOf(this.selected);
    if (side == 'min') {
      if (this.selected.min_address <= devices[indexSelectedDevice - 1].max_address) {
        this.selected.setMinAddress(devices[indexSelectedDevice - 1].max_address + 1);
      }
    } else if (side == 'max') {
      if (this.selected.max_address >= devices[indexSelectedDevice + 1].min_address) {
        this.selected.setMaxAddress(devices[indexSelectedDevice + 1].min_address - 1);
      }
    }
    if (parseInt(this.selected.size) >= 128 || this.selected instanceof LogicalNetwork) {
      this.memoryService.save();
    } else {
      this.dialog.open(MessageDialogComponent, {
        data: { message: 'Memory is less than 128MB' }
      });
    }
  }

  moveSelectedLeft() {
    let endAddress = 0;
    let indexSelectedDevice = this.memoryService.memory.devices.indexOf(this.selected);
    let sizeOfSelected = this.selected.max_address - this.selected.min_address;
    let spaceBeforeFirstDevice = this.memoryService.memory.devices[indexSelectedDevice].min_address - this.memoryService.memory.devices[indexSelectedDevice - 1].max_address;
    if (spaceBeforeFirstDevice >= 33554432) {
      this.selected.setMaxAddress(this.selected.max_address - 33554432);
      this.selected.setMinAddress(this.selected.min_address - 33554432);
    } else if ((endAddress = this.spaceBetweenDevices(indexSelectedDevice, sizeOfSelected, 'left')) != 0) {
      this.selected.setMaxAddress(endAddress - 1);
      this.selected.setMinAddress(this.selected.max_address - sizeOfSelected);
    }

    this.memoryService.memory.devices = this.memoryService.memory.devices.sort((a, b) => a.min_address - b.min_address);
    this.memoryService.save();
  }

  moveSelectedRight() {
    let startAddress = 0;
    let indexSelectedDevice = this.memoryService.memory.devices.indexOf(this.selected);
    let sizeOfSelected = this.selected.max_address - this.selected.min_address;
    let spaceBeforeFirstDevice = this.memoryService.memory.devices[indexSelectedDevice + 1].min_address - this.memoryService.memory.devices[indexSelectedDevice].max_address;
    if (spaceBeforeFirstDevice >= 33554432) {                                                            // Muovi avanti 128Mb se c'è abbastanza spazio
      this.selected.setMaxAddress(this.selected.max_address + 33554432);
      this.selected.setMinAddress(this.selected.min_address + 33554432);
    } else if ((startAddress = this.spaceBetweenDevices(indexSelectedDevice, sizeOfSelected, 'right')) != 0) {   // Muovi tra due device avanti a me
      this.selected.setMinAddress(startAddress + 1);
      this.selected.setMaxAddress(this.selected.min_address + sizeOfSelected);
    }
    this.memoryService.memory.devices = this.memoryService.memory.devices.sort((a, b) => a.min_address - b.min_address);
    this.memoryService.save();
  }

  private spaceBetweenDevices(indexSelectedDevice: number, sizeOfSelected: number, side: string): number {
    for (let i = indexSelectedDevice; i < this.memoryService.memory.devices.length - 2 && side == 'right'; i++) {
      if ((this.memoryService.memory.devices[i + 2].min_address - this.memoryService.memory.devices[i + 1].max_address) >= sizeOfSelected) {
        return this.memoryService.memory.devices[i + 1].max_address;
      }
    }
    for (let i = indexSelectedDevice; i > 1 && side == 'left'; i--) {
      if ((this.memoryService.memory.devices[i - 1].min_address - this.memoryService.memory.devices[i - 2].max_address) >= sizeOfSelected) {
        return this.memoryService.memory.devices[i - 1].min_address;
      }
    }
    return 0;
  }

  // METODO INVOCATO CLICCANDO SU SHOW DETAIL CHE PERMETTE LA VISUALIZZAZIONE BYTE PER BYTE DEI VALORI IN MEMORIA

  readMemoryDetail(addr){

    let finalAddr;

    // controllo che in input siano inseriti degli indirizzi in formato esadecimale che inizino per 0x altrimenti
    // si aprirà una finestra d'errore

    if((! addr.startsWith("0x") && ! addr.startsWith("0X")) || addr.length !== 10 || isNaN(addr)) {
      this.dialog.open(ErrorDialogComponent,{
        data: { message: "Format Error : only hexadecimal value starting with 0x" }
      })
      return;
    }

    let iv = parseInt(addr, 16);
    if (iv || iv === 0) {
      finalAddr = iv >>> 2;
    }

    // Cerco nella memoria quale Device è allocato all'indirizzo scelto dall'utente. Se a quell'indirizzo non è
    // mappato alcun device si aprirà una finestra d'errore

    let d = this.memoryService.memory.devices.find(el => el.min_address <= finalAddr && el.max_address >= finalAddr);
      if(d==null){
        this.dialog.open(ErrorDialogComponent,{
        data: { message: "No memory allocated in this range" }
      })
      return;
      }

      // per visualizzare sempre il codice a partire da multipli di 4, così da non avere disallineamento tra
    // indirizzo e codifica

    if(iv % 4 !== 0) iv = (Math.floor(iv/4))*4;
    let instr = d.load(finalAddr);

    // se la memoria a quell'indirizzo non è ancora stata inizializzata , allora la load restituirà un valore undefined
    // in tal caso visualizzerò un valore casuale scelto con la riga di codice seguente

    if(isUndefined(instr)) instr= Math.floor(Math.random()*4294967296);
    //if(isUndefined(instr)) instr= Math.floor(Math.random()*256); //Gabri 2^8 max
    let bin=(instr >>> 0).toString(2).padStart(32, '0');
    let arrData = [] ;

    //Spezzo il valore a 32 bit in gruppi da un byte e inserisco ciascun byte nell'array
    //con il relativo indirizzo associato

    for (let i=0 ; i<32 ; i+=8) {
      arrData.push(
        {
          iv: iv,
          instruction : (instr >>> 0).toString(16).padStart(8,'0').toUpperCase() ,
          value: bin.slice(24-i,32-i) ,    // riempio l'array dalla fine per visualizzare in formato Little Endian
          address: iv + (i/8),
          hexAddress: d.getAddressHexInstr(iv + i/8)
        })
    }

    // Rovescio l'array per visualizzare a partire dall'indirizzo più
    // significativo a quello meno significativo

    arrData.reverse();
    this.dialog.open(InstructionDialogComponent, {
      data: { values: arrData, service: this.memoryService },
    });
  }

  readMemoryAddressValues(addr) {
    let finalAddr;
    if((! addr.startsWith("0x") && ! addr.startsWith("0X")) || addr.length !== 10 || isNaN(addr)) {
      this.dialog.open(ErrorDialogComponent,{
        data: { message: "Format Error : only hexadecimal value starting with 0x" }
      })
      return;
    }
    let iv = parseInt(addr, 16);
    if (iv || iv === 0) {
      finalAddr = iv >>> 2;// è un numero a 32 bit sotto
    }
      let d = this.memoryService.memory.devices.find(el => el.min_address <= finalAddr && el.max_address >= finalAddr);
      if(d==null){
        this.dialog.open(ErrorDialogComponent,{
        data: { message: "No memory allocated in this range" }
      })
      return;
      }
      let arrData = [];
      for (let i = 0; i < 8; i++) {
        let v = d.load(finalAddr + (i * 0x00000001));
        if(isUndefined(v)) v= Math.floor(Math.random()*4294967296);
        // nel caso la cella di memoria non contenga alcun valore visualizzo un valore casuale
        //(4294...=2^32 cioè il valore massimo rappresentabile con 32 bit) per simulare il fatto
        // che le celle di memoria contengono valori casuali all'inizializzazione
        arrData.push(
          {
            value: v ,
            address: finalAddr + (i * 0x00000001),
            hexAddress: d.getAddressHex(finalAddr + (i * 0x00000001))
          });
      }
      // Rovescio l'array per visualizzare a partire dall'indirizzo più
      // significativo a quello meno significativo
      arrData.reverse();
      this.dialog.open(MemoryAddressDialogComponent, {
        data: { values: arrData, service: this.memoryService },
      });

  }

  isLN(dev: Device) {
    return dev instanceof LogicalNetwork;
  }

  openImageInterrupt() {
    this.dialog.open(ImageDialogComponent, {
      data: { src: "assets/img/rete-interrupt2.jpg" }
    });
  }
}






