import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../dialogs/error-dialog.component';
import { InputPort } from '../memory/model/input-port';


@Component({
  templateUrl: './input-port-dialog.component.html',
})
export class InputPortDialogComponent implements OnInit{

  constructor(@Inject(MAT_DIALOG_DATA) public data: {network : InputPort}, private dialog: MatDialog) {}

  dim_last : number;
  url_image : string;

  onSubmit(){
    //setto la lunghezza della porta in input
    let dim = this.data.network.size_port;
    if(dim != 8 && dim != 16 && dim != 32){
      // console.log("Size non corretta");
      this.dialog.open(ErrorDialogComponent,{
        data: { message: "Size Port must be: 8 / 16 / 32 bit" }
      })
      this.data.network.size_port = this.dim_last;
      return;
    }
  }

  ngOnInit(){
    this.dim_last = this.data.network.size_port;
    this.url_image = "assets/img/input-port/input_port_bit_"+this.dim_last+".png"
    // console.log("ngOnInit");
  }

}
