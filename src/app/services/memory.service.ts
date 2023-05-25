import { Injectable, Injector } from '@angular/core';
import { Device, IDevice } from '../memory/model/device';
import { Eprom } from '../memory/model/eprom';
import { LedLogicalNetwork } from '../memory/model/led.logical-network';
import { Counter } from '../memory/model/counter';
import { Memory } from '../memory/model/memory';
import { StartLogicalNetwork } from '../memory/model/start.logical-network';
import { InputPort } from '../memory/model/input-port';

@Injectable({
  providedIn: 'root'
})
export class MemoryService {

  memory: Memory;
  injector: Injector;
  constructor(injector: Injector) {
    this.injector = injector;
    this.setMemory();
  }

  public setMemory() {
    let tmp = window.localStorage.getItem('memory');
    console.log(tmp);
    if (tmp) {
      this.memory = new Memory(tmp, this.injector);
    } else {
      this.memory = new Memory();
      this.memory.add(Eprom, 0x00000000, 0x07FFFFFF, this.injector);
      this.memory.add('RAM_A', 0x10000000, 0x1FFFFFFF);
      this.memory.add(StartLogicalNetwork, 0x30000000, 0x30000003, this.injector);
      this.memory.add(LedLogicalNetwork, 0x24000000, 0x24000003, this.injector);
      this.memory.add(Counter, 0x29000000, 0x29000005, this.injector);
      this.memory.add('RAM_B', 0x38000000, 0x3FFFFFFF);
      this.memory.add(InputPort, 0x0C000000, 0x0C000003, this.injector);
    }
  }

  public add(name: string | IDevice, min_address: number, max_address: number, injector?: Injector): void {
    this.memory.add(name, min_address, max_address, injector);
  }
  public remove(dev: Device): void {
    this.memory.remove(dev);
  }

  public clearMemory = () => {
    window.localStorage.removeItem('memory');
  }

  save() {
    window.localStorage.setItem('memory', JSON.stringify(this.memory.devices.map(dev => {
      return { proto: dev.constructor.name, name: dev.name, min_address: dev.min_address, max_address: dev.max_address };
    })));
  }

  getEprom(): Eprom {
    return this.memory.get('EPROM') as Eprom;
  }

  getCounter(): Counter {
    console.log("name "+this.memory.get('COUNTER').name)
    return this.memory.get('COUNTER') as Counter;
  }
}
