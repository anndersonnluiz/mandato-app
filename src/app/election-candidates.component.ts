import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-election-candidates',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="election-candidates">
      <article *ngFor="let candidate of candidates" [class.incumbent]="candidate.isIncumbent">
        <span>{{ candidate.isIncumbent ? 'GOVERNO ATUAL' : 'OPOSIÇÃO' }}</span>
        <strong>{{ candidate.name }}</strong>
        <small>{{ candidate.style }}</small>
        <small>{{ candidate.platform }}</small>
        <small>Apoio projetado {{ candidate.support | number: '1.0-1' }}% · Rejeição {{ candidate.rejection | number: '1.0-1' }}%</small>
      </article>
    </div>
    <div class="election-poll" *ngIf="poll as currentPoll">
      <span><b>{{ currentPoll.period }}</b> · {{ currentPoll.undecided | number: '1.0-1' }}% indecisos</span>
      <span *ngFor="let candidate of currentPoll.candidates">{{ candidate.name }} <b>{{ candidate.support | number: '1.0-1' }}%</b></span>
    </div>
    <div class="poll-history" *ngIf="pollHistory.length > 1">
      <div class="poll-history-heading"><small>EVOLUÇÃO DAS PESQUISAS</small><span>{{ pollHistory.length }} medições</span></div>
      <div class="poll-row" *ngFor="let item of pollHistory">
        <strong>{{ item.period }}</strong>
        <div class="poll-bars"><span *ngFor="let candidate of item.candidates" [style.width.%]="candidate.support" [title]="candidate.name + ': ' + (candidate.support | number: '1.0-1') + '%'"> </span></div>
        <em>{{ item.candidates[0]?.support | number: '1.0-1' }}%</em>
      </div>
    </div>
  `,
})
export class ElectionCandidatesComponent {
  @Input() candidates: any[] = [];
  @Input() poll: any = null;
  @Input() pollHistory: any[] = [];
}
