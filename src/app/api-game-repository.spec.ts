import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiGameRepository } from './api-game-repository';

describe('ApiGameRepository', () => {
  let repository: ApiGameRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    repository = new ApiGameRepository(
      TestBed.inject(HttpClient),
      'http://api.test/api',
    );
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a game through REST', () => {
    repository.create({ mayorName: 'Ana', cityName: 'Aurora' }).subscribe();

    const request = http.expectOne('http://api.test/api/games');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      mayorName: 'Ana',
      cityName: 'Aurora',
    });
    request.flush({});
  });

  it('checks API health through REST', () => {
    repository.health().subscribe();
    const request = http.expectOne('http://api.test/api/health');
    expect(request.request.method).toBe('GET');
    request.flush({ status: 'ok' });
  });

  it('resolves and advances through REST', () => {
    repository.resolve('g1', 'd1', 'hire').subscribe();

    const resolveRequest = http.expectOne(
      'http://api.test/api/games/g1/decisions/d1/resolve',
    );
    expect(resolveRequest.request.method).toBe('POST');
    expect(resolveRequest.request.body).toEqual({ optionId: 'hire' });
    expect(resolveRequest.request.headers.has('x-operation-id')).toBeTrue();
    resolveRequest.flush({});

    repository.advance('g1').subscribe();

    const advanceRequest = http.expectOne(
      'http://api.test/api/games/g1/advance-day',
    );
    expect(advanceRequest.request.method).toBe('POST');
    advanceRequest.flush({});
  });

  it('loads a game, continues a mandate and adopts a focus through REST', () => {
    repository.load('g1').subscribe();
    const loadRequest = http.expectOne('http://api.test/api/games/g1');
    expect(loadRequest.request.method).toBe('GET');
    loadRequest.flush({});

    repository.continue('g1', 'continue-op-1').subscribe();
    const continueRequest = http.expectOne('http://api.test/api/games/g1/continue');
    expect(continueRequest.request.method).toBe('POST');
    expect(continueRequest.request.body).toEqual({});
    expect(continueRequest.request.headers.get('x-operation-id')).toBe('continue-op-1');
    continueRequest.flush({});

    repository.adoptFocus('g1', 'Consolidar serviços', 'service').subscribe();
    const focusRequest = http.expectOne('http://api.test/api/games/g1/focus');
    expect(focusRequest.request.method).toBe('POST');
    expect(focusRequest.request.body).toEqual({ label: 'Consolidar serviços', metric: 'service' });
    expect(focusRequest.request.headers.has('x-operation-id')).toBeFalse();
    focusRequest.flush({});
  });

  it('adjusts a secretary budget with an idempotency header', () => {
    repository.adjustBudget('g1', 'health', 500, 'budget-op-1').subscribe();

    const request = http.expectOne('http://api.test/api/games/g1/budget');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ key: 'health', delta: 500 });
    expect(request.request.headers.get('x-operation-id')).toBe('budget-op-1');
    request.flush({});
  });

  it('persists the election state through REST', () => {
    repository.saveElection('g1', { phase: 'CAMPAIGN', week: 1, candidates: [{ id: 'x', name: 'X', isIncumbent: true, support: 50, rejection: 20, platform: 'p', style: 's' }], incumbentAgenda: [], debateCompleted: false, debateQuestion: 'q', history: [], pollHistory: [], campaignFunds: 80, promises: [] }).subscribe();
    const request = http.expectOne('http://api.test/api/games/g1/election');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ state: { phase: 'CAMPAIGN', week: 1, candidates: [{ id: 'x', name: 'X', isIncumbent: true, support: 50, rejection: 20, platform: 'p', style: 's' }], incumbentAgenda: [], debateCompleted: false, debateQuestion: 'q', history: [], pollHistory: [], campaignFunds: 80, promises: [] } });
    request.flush({});
  });

  it('loads the election state through its dedicated REST route', () => {
    repository.loadElection('g1').subscribe();
    const request = http.expectOne('http://api.test/api/games/g1/election');
    expect(request.request.method).toBe('GET');
    request.flush({ gameId: 'g1', electionState: null });
  });
});
