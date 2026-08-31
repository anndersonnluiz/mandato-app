import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ElectionStateContract, GameViewContract } from './api-game-contract';

export type CreateGameInput = { mayorName: string; cityName: string };

/** Adaptador REST isolado; a UI pode continuar offline enquanto a API não estiver disponível. */
export class ApiGameRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly baseUrl = 'http://localhost:3000/api',
  ) {}
  health(): Observable<{ status: string; persistence?: string; asyncProvider?: string }> {
    return this.http.get<{ status: string; persistence?: string; asyncProvider?: string }>(`${this.baseUrl}/health`);
  }
  create(input: CreateGameInput): Observable<GameViewContract> {
    return this.http.post<GameViewContract>(`${this.baseUrl}/games`, input);
  }
  load(id: string): Observable<GameViewContract> {
    return this.http.get<GameViewContract>(`${this.baseUrl}/games/${id}`);
  }
  private operationHeaders(operationId?: string) {
    return {
      headers: new HttpHeaders({ 'x-operation-id': operationId ?? crypto.randomUUID() }),
    };
  }
  resolve(
    id: string,
    decisionId: string,
    optionId: string,
    operationId?: string,
  ): Observable<GameViewContract> {
    return this.http.post<GameViewContract>(
      `${this.baseUrl}/games/${id}/decisions/${decisionId}/resolve`,
      { optionId },
      this.operationHeaders(operationId),
    );
  }
  advance(id: string, operationId?: string): Observable<GameViewContract> {
    return this.http.post<GameViewContract>(
      `${this.baseUrl}/games/${id}/advance-day`,
      {},
      this.operationHeaders(operationId),
    );
  }
  advanceUntil(id: string, mode: 'DECISION' | 'NOTIFICATION' | 'MONTH', operationId?: string): Observable<GameViewContract & { advanceSummary?: { daysAdvanced: number; mode: string } }> {
    return this.http.post<GameViewContract & { advanceSummary?: { daysAdvanced: number; mode: string } }>(
      `${this.baseUrl}/games/${id}/advance-until`, { mode }, this.operationHeaders(operationId),
    );
  }
  continue(id: string, operationId?: string): Observable<GameViewContract> {
    return this.http.post<GameViewContract>(
      `${this.baseUrl}/games/${id}/continue`,
      {}, this.operationHeaders(operationId),
    );
  }
  adoptFocus(id: string, label: string, metric: 'treasury' | 'capacity' | 'service' | 'social'): Observable<GameViewContract> {
    return this.http.post<GameViewContract>(`${this.baseUrl}/games/${id}/focus`, { label, metric });
  }
  adjustBudget(id: string, key: string, delta: number, operationId?: string): Observable<GameViewContract> {
    return this.http.post<GameViewContract>(`${this.baseUrl}/games/${id}/budget`, { key, delta }, this.operationHeaders(operationId));
  }
  saveElection(id: string, state: ElectionStateContract): Observable<GameViewContract> {
    return this.http.post<GameViewContract>(`${this.baseUrl}/games/${id}/election`, { state });
  }
  loadElection(id: string): Observable<{ gameId: string; electionState: Record<string, unknown> | null }> {
    return this.http.get<{ gameId: string; electionState: Record<string, unknown> | null }>(`${this.baseUrl}/games/${id}/election`);
  }
}
