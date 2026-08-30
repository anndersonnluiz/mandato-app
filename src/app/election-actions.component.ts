import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-election-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="campaign-actions" *ngIf="phase === 'CAMPAIGN'">
      <small>SEMANA {{ week + 1 }} DE 3 · verba de campanha <b>{{ funds | number: '1.0-0' }} créditos</b></small>
      <button type="button" [disabled]="funds < 10" (click)="campaign.emit('MEET_GROUPS')">Ouvir grupos sociais <small>−10</small></button>
      <button type="button" [disabled]="funds < 15" (click)="campaign.emit('VISIT_PROJECT')">Visitar uma entrega <small>−15</small></button>
      <button type="button" [disabled]="funds < 20" (click)="campaign.emit('CRISIS_COMMUNICATION')">Comunicar em crise <small>−20</small></button>
      <button type="button" [disabled]="funds < 30" (click)="campaign.emit('NEW_PROMISE')">Lançar promessa <small>−30</small></button>
    </div>
    <div class="campaign-actions" *ngIf="phase === 'DEBATE'">
      <small>DEBATE · responda à principal crítica da oposição</small>
      <p class="debate-question">“{{ question }}”</p>
      <button type="button" (click)="debate.emit('ACCOUNTABILITY')">Prestar contas</button>
      <button type="button" (click)="debate.emit('PROPOSAL')">Apresentar proposta</button>
      <button type="button" (click)="debate.emit('ADMIT_FAILURE')">Admitir falhas</button>
      <button type="button" (click)="debate.emit('ATTACK')">Atacar a oposição</button>
    </div>
  `,
})
export class ElectionActionsComponent {
  @Input() phase = '';
  @Input() funds = 0;
  @Input() week = 0;
  @Input() question = '';
  @Output() campaign = new EventEmitter<string>();
  @Output() debate = new EventEmitter<string>();
}
