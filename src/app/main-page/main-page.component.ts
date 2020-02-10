import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { Registri } from '../registri/registri';
import { ActivatedRoute } from '@angular/router';
import { Interpreter } from '../interpreters/interpreter';
import { MatSidenav } from '@angular/material/sidenav';
import { CodeService } from '../services/code.service';
import { MemoryService } from '../services/memory.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.sass']
})
export class MainPageComponent implements OnInit {

  editorMode: string;
  interpreter: Interpreter;
  registri: Registri;

  @ViewChild('sidenav', {static: true}) sidenav: MatSidenav;

  @Input() sidebarOpened: boolean;
  @Output() sidebarOpenedChange: EventEmitter<number> = new EventEmitter();

  constructor(
    private route: ActivatedRoute,
    private codeService: CodeService,
    private memoryService: MemoryService,
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.editorMode = data.editorMode;
      this.interpreter = data.interpreter;
      this.registri = data.registri;
      this.codeService.interpreter = data.interpreter;
    })
  }

  onRun(line: string) {
    this.interpreter.run(line, this.registri, this.memoryService.memory);
  }

  doParseTags(code: string) {
    this.interpreter.parseTags(code);
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }
}
