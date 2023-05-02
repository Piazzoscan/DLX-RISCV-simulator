import { DLXDocumentation } from 'src/app/documentation/dlx.documentation';
import { Memory } from 'src/app/memory/model/memory';
import { DiagramService } from 'src/app/services/diagram.service';
import { DLXRegisters } from '../../registers/dlx.registers';
import { Registers } from '../../registers/registers';
import { Interpreter } from '../interpreter';
import { NotExistingInstructionError, WrongArgumentsError } from '../interpreter-errors';
import { encoder, inputs_encoder } from './dlx.encoder';
import { instructions, InstructionType, signExtend, uintToInt, specialRegisters } from './dlx.instructions';

export class DLXInterpreter extends Interpreter{

    private tmpReg : any;

    private readonly process_instruction: {
        [key in InstructionType]:
            (line: string, instruction: string, args: number[], func: (registers: DLXRegisters, args?: number[]) => number, registers: DLXRegisters, memory?: Memory, unsigned?: boolean, tagged?: boolean) => void
    } = {
        R: (line, instruction, [rd, rs1, rs2], func, registers) => {
            if (!(/\w+\s+R[123]?\d\s*,\s*R[123]?\d\s*,\s*R[123]?\d/i.test(line))) throw new WrongArgumentsError(instruction, DLXDocumentation);
            registers.a = registers.r[rs1];
            registers.temp = registers.b = registers.r[rs2];
            try {
                func(registers);
            } catch(e) {
                this.handleOverflow(e, registers);
            }
            if (rd) {
                registers.r[rd] = registers.c;
                registers.setBold(rd);
            }
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
        },
        RM: (_line, _instruction, args, func, registers) => {
            func(registers, args);
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
        },
        I: (line, instruction, [rd, rs1, immediate], func, registers, _memory, unsigned = false) => {
            if (!(/\w+\s+R[123]?\d\s*,\s*R[123]?\d\s*,\s*0x([0-9A-F]{4})/i.test(line))) throw new WrongArgumentsError(instruction, DLXDocumentation);
            registers.a = registers.r[rs1];
            registers.b = registers.r[rd];
            registers.temp = unsigned ? immediate : uintToInt(immediate,16,32);
            try {
                func(registers);
            } catch(e) {
                this.handleOverflow(e, registers);
            }
            if (rd) {
                registers.r[rd] = registers.c;
                registers.setBold(rd);
            }
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
        },
        IB: (line, instruction, [rs1, name], func, registers, _memory, unsigned = false,tagged) => {
            if (!(/\w+\s+R[123]?\d\s*,\s*\w+/i.test(line))) throw new WrongArgumentsError(instruction, DLXDocumentation);

            // Se nella branch si fa riferimento ad un tag saltiamo direttamente a quello. Nel registro
            // temp ci carico l'indirizzo del tag . Il valore di temp sarà poi caricare nel pc.

            if(tagged === true) {
                registers.a = registers.r[rs1];
                registers.temp = name ;
                func(registers);
            }
            else

            // Se invece al posto del tag c'è un immediato a 16 bit , nel pc dovrò caricare il valore
            // pc + 4 + immediato 16 bit esteso con segno

            {
                registers.a = registers.r[rs1];

                // converto in decimale con segno
                // dentro la uintToInt è già effettuata la conversione del segno

                name = uintToInt(name,16,32);
                registers.temp = registers.pc + name ;
                func(registers);
            }
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
        },
        IJ: (line, instruction, [rs1], func, registers) => {
            if (!(/\w+\s+R[123]?\d/i.test(line))) throw new WrongArgumentsError(instruction, DLXDocumentation);
            registers.a = registers.r[rs1];
            func(registers);
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
        },
        IL: (line, instruction, [rd, offset, rs1], func, registers, memory) => {
            if (!(/\w+\s+R[123]?\d\s*,\s*0x([0-9A-F]{4})\s*\(\s*R[123]?\d\s*\)\s*/i.test(line))) throw new WrongArgumentsError(instruction, DLXDocumentation);
            registers.a = registers.r[rs1];
            registers.b = registers.r[rd];
            registers.mar = signExtend(offset) + registers.a;
            let rest = (registers.mar >>> 0) % 4   //permette di capire a da quale byte partiamo per l'accesso in memoria  es: FFFF0003 -> 3 byte (quello meno significativo)
            let addr = Math.floor((registers.mar >>> 0) / 4) >>> 0;
            registers.mdr = memory.load(addr,"IL");
            ///console.log("mdr: ",registers.mdr.toString(16))
            registers.temp = rest
            func(registers);
            if (rd) {
                registers.r[rd] = registers.c;
                registers.setBold(rd);
            }
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.load();
            }
        },
        IS: (line, instruction, [rd, offset, rs1], func, registers, memory) => {
            if (!(/\w+\s+R[123]?\d\s*,\s*0x([0-9A-F]{4})\s*\(\s*R[123]?\d\s*\)\s*/i.test(line))) throw new WrongArgumentsError(instruction, DLXDocumentation);
            registers.a = registers.r[rs1];
            registers.mdr = registers.b = registers.r[rd];
            registers.mar = signExtend(offset) + registers.a;
            registers.setBoldMar();
            registers.setBoldMdr();
            let rest = (registers.mar >>> 0) % 4   //permette di capire a da quale byte partiamo per l'accesso in memoria  es: FFFF0003 -> 3 byte (quello meno significativo)
            registers.temp = rest;
            let addr = Math.floor((registers.mar >>> 0) / 4) >>> 0;
            memory.store(addr, func(registers, [memory.load(addr,"IS")]));
            //se l'esecuzione è impostata su auto, l'animazione viene gestita dall'interprete
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.store();
            }
        },
        J: (line, instruction, [name], func, registers, _memory, unsigned = false,tagged) => {
            if (!(/\w+\s+\w+/i.test(line))) throw new WrongArgumentsError(instruction, DLXDocumentation);
            if(tagged === true ) {
                registers.temp = name ;
                func(registers);
            } else {
                if (unsigned) {
                    registers.temp = registers.pc + 4 + name ;
                } else {
                    name = uintToInt(name,26,32);
                    registers.temp = registers.pc + name ;
                }
            func(registers);
            }
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
        },
        LHI: (line, instruction, [rd, immediate], func, registers) => {
            if (!(/\w+\s+R[123]?\d\s*,\s*0x([0-9A-F]{4})/i.test(line))) throw new WrongArgumentsError(instruction, DLXDocumentation);
            registers.temp = immediate;
            func(registers);
            if (rd) {
                registers.r[rd] = registers.c;
                registers.setBold(rd);
            }
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
        },
        NOP: () => {
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
        },
        RFE: (_line, instruction, args, func, registers) => {
            if (args.length) throw new WrongArgumentsError(instruction, DLXDocumentation);
            func(registers);
            this.interruptEnabled = true;
            (registers as DLXRegisters).ien = 0;
            (registers as DLXRegisters).resetBoldIen();
            if(DiagramService.instance.isAuto()){
                DiagramService.instance.addressVisible = false;
                if(!DiagramService.instance.dlxDiagrams.clock.isRunning()){
                    DiagramService.instance.idle();
                }
            }
            // registers.r = this.tmpReg;
        }
    }

    // In caso di overflow si notifica l'errore di overflow
    // Nella versione precedente ci si comportava come nel codice commentato.
    // Io l'ho tolto perchè facendo come nel codice commentato quando avveniva un overflow
    // non si capiva e sembrava che il codie impazzisse e tornasse ogni volta dal punto di partenza
    // Lascio comunque la vecchia versione nel caso volesse essere ripristinata.

    private handleOverflow(e: Error, registers: DLXRegisters) {
        /*if (['overflow', 'fault'].includes(e.message)) {
            this.interruptEnabled = false;
            (registers as DLXRegisters).iar = registers.pc;
            registers.pc = 0;
        } else {*/
            throw e;
        //}
    }

    private processLine(line: string): [string, number[], string, boolean]{
        let tokens: string[];
        let lineFixed: string;

        // La variabile tagged indica se nel caso delle istruzioni di branch e jump se si utilizza
        // un tag. Nel caso di utilizzo di tag bisognerà fare un "salto" assoluto mentre nel caso di
        // immediato sarà caricato nel pc il valore pc + 4 + immediato

        let tagged: boolean= false;
        if (!line || line.match(/^;/)) {
            tokens = ['NOP'];
        } else {
            lineFixed = line.split(';')[0].replace(/^(\w+:)?\s+/, '');
            tokens = lineFixed.split(/\W+/);
        }

        let [instruction, ... args] = tokens;
        let argsFixed: number[] = [];

        if (instructions[instruction]) {
            argsFixed = args.map<number>(arg => {
                if (arg.match(/^R[123]?\d/i)) {
                    return parseInt(arg.substr(1));
                } else if (specialRegisters.includes(arg.toUpperCase())) {
                    return specialRegisters.indexOf(arg.toUpperCase()) + 1;
                } else if (arg.match(/^0x([0-9A-F]{4})/i)) {
                    if (['J'].includes(instructions[instruction].type) && arg.length == 9) // nel caso di jump in cui ho immediato a 26 bit
                        return parseInt(arg.substring(2,9),16);  // prendo 7 byte
                    else if(['J'].includes(instructions[instruction].type) && arg.length!=9)
                        throw new Error(instruction + " has 26 bit immediate")
                    else if (arg.length == 6)
                        return parseInt(arg.substr(2, 4), 16);  // prendo 4 byte
                    else
                        throw new Error(instruction + " has 16 bit immediate");
                } else if (this.tags[arg]>=0) {
                    tagged=true;  // si utilizza un tag
                    return this.tags[arg];
                } else if (arg)
                    if (['IB', 'J'].includes(instructions[instruction].type))
                        throw new Error("the tag doesn't exist")
                    else
                        throw new WrongArgumentsError(instruction, DLXDocumentation);
            });
        } else if (instruction) {
            throw new NotExistingInstructionError(instruction);
        }
        return [instruction, argsFixed, lineFixed,tagged];
    }

    public run(line: string, registers: Registers, memory: Memory): void {
        let [instruction, argsFixed, lineFixed, tagged] = this.processLine(line);
        let inst = instructions[instruction];
        if(inst) {
            let [opcode, alucode] = encoder[instruction];
            (registers as DLXRegisters).ir = parseInt(opcode + inputs_encoder[inst.type](argsFixed) + alucode, 2); //otteniamo l'istruzione scritta in 32 bit
            (registers as DLXRegisters).setBold(0);
            (registers as DLXRegisters).resetBoldReg();
            this.process_instruction[inst.type](lineFixed, instruction, argsFixed, inst.func, registers as DLXRegisters, memory, inst.unsigned,tagged);
        }
    }

    public encode(line: string): number {
        try {
            let [instruction, argsFixed] = this.processLine(line);
            let inst = instructions[instruction];
            let [opcode, alucode] = encoder[instruction];
            //NB: inverto ordine dei bit dell'opcode da -sig->+sig a +sig->-sig ; come vengono salvati i valori convertiti in binario
            return parseInt(this.revString(opcode) + inputs_encoder[inst.type](argsFixed) + alucode, 2);
        } catch(error) {
            return 0;
        }
    }

    public interrupt(registers: Registers): void {
        if (this.interruptEnabled) {
            (registers as DLXRegisters).iar = registers.pc;
            (registers as DLXRegisters).setBoldIar();
            registers.pc = 0;
            this.interruptEnabled = false;
            (registers as DLXRegisters).ien = 1;
            (registers as DLXRegisters).setBoldIen();
            // this.tmpReg = (registers as DLXRegisters).r;
            // (registers as DLXRegisters).r = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        }
    }

    /*
    Funzione di utilità utilizzata per invertire l'ordine dei bit nell'opcode.
    */
    public revString(str: string) {
        return str.split("").reverse().join("");
    }
}
