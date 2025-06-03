import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenService, LeaderboardEntry } from '../../services/token.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Token Holders Leaderboard</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Address</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of leaderboard$ | async">
                <td>{{ entry.rank }}</td>
                <td>
                  <code [class.text-danger]="entry.isBlacklisted">
                    {{ entry.address }}
                  </code>
                </td>
                <td>{{ entry.balance.toFixed(4) }}</td>
                <td>
                  <span 
                    [class]="entry.isBlacklisted ? 'badge bg-danger' : 'badge bg-success'"
                  >
                    {{ entry.isBlacklisted ? 'Blacklisted' : 'Active' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class LeaderboardComponent {
  leaderboard$: Observable<LeaderboardEntry[]>;

  constructor(private tokenService: TokenService) {
    this.leaderboard$ = this.tokenService.leaderboard$;
  }
}
