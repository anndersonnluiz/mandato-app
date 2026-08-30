import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-government-memory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="memoria" class="panel narrative-panel memory-panel area-anchor" *ngIf="history.length">
      <div class="section-heading"><span class="section-kicker">REGISTRO DO MANDATO</span><h2>Memória do governo</h2></div>
      <div class="feed-list">
        <article class="feed-item" *ngFor="let item of history | slice: 0 : 4">
          <span class="feed-icon">↳</span>
          <div><small class="feed-type">{{ narrativeType(item) }}</small><p>{{ formatNarrative(item) }}</p></div>
        </article>
      </div>
    </section>
  `,
})
export class GovernmentMemoryComponent {
  @Input() history: string[] = [];
  @Input() formatNarrative: (value: string) => string = (value) => value;
  @Input() narrativeType: (value: string) => string = () => 'REGISTRO';
}
