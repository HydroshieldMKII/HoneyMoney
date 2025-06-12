import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var Reveal: any;

@Component({
  selector: 'app-blockchain-presentation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="presentation-container">
      <div class="reveal" #revealContainer>
        <div class="slides">
          <!-- Title Slide -->
          <section>
            <h1>Comment fonctionne la Blockchain</h1>
            <!-- <h3>Un guide complet sur la technologie des registres distribués</h3> -->
            <p style="text-align: center;">
              <small>Comprendre les fondamentaux de la technologie blockchain</small>
            </p>
          </section>

          <!-- What is Blockchain -->
          <section>
            <h2>Qu'est-ce que la Blockchain ?</h2>
            <ul>
              <li class="fragment">Technologie de <span class="highlight">registre distribué</span></li>
              <li class="fragment">Chaîne de <span class="highlight">blocs liés cryptographiquement</span></li>
              <li class="fragment"><span class="highlight">Décentralisée</span> et immuable</li>
              <li class="fragment">Maintient un <span class="highlight">enregistrement chronologique</span> des transactions</li>
              <li class="fragment">Aucun point de défaillance ou de contrôle unique</li>
            </ul>
          </section>

          <!-- Block Structure -->
          <section>
            <h2>Structure d'un Bloc</h2>
            <div style="text-align: center;">
              <div class="blockchain-block">
                <h4>En-tête du Bloc</h4>
                <p><strong>Hash Précédent :</strong> <span class="block-hash">0x1a2b3c...</span></p>
                <p><strong>Hash du bloc :</strong> <span class="block-hash">0x4d5e6f...</span></p>
                <p><strong>Horodatage :</strong> 2024-01-15 14:30:00</p>
                <hr>
                <h4>Données de Transaction</h4>
                <p>• Transaction 1 : Alice → Bob (5 ETH)</p>
              </div>
            </div>
          </section>

          <!-- Chain Formation -->
          <section>
            <h2>Comment les Blocs Forment une Chaîne</h2>
            <div style="text-align: center; font-size: 0.8em;">
              <div class="blockchain-block">
                <strong>Bloc 1 (Genèse)</strong><br>
                Prec: 0x000...<br>
                Hash: <span class="block-hash">0xabc123...</span>
              </div>
              <span class="arrow">→</span>
              <div class="blockchain-block">
                <strong>Bloc 2</strong><br>
                Prec: <span class="block-hash">0xabc123...</span><br>
                Hash: <span class="block-hash">0xdef456...</span>
              </div>
              <span class="arrow">→</span>
              <div class="blockchain-block">
                <strong>Bloc 3</strong><br>
                Prec: <span class="block-hash">0xdef456...</span><br>
                Hash: <span class="block-hash">0x789xyz...</span>
              </div>
              <span class="arrow">→</span>
              <div class="blockchain-block">
                <strong>Bloc 4</strong><br>
                Prec: <span class="block-hash">0x789xyz...</span><br>
                Hash: <span class="block-hash">0x123abc...</span>
              </div>
            </div>
            <p class="fragment" style="text-align: center; margin-top: 30px;">
              Chaque bloc contient le hash du bloc précédent, créant une <span class="highlight">chaîne immuable</span>
            </p>
          </section>

          <!-- Cryptographic Hashing -->
          <section>
            <h2>Hachage Cryptographique</h2>
            <ul>
              <li class="fragment">L'algorithme <strong>SHA-256</strong> est couramment utilisé</li>
              <li class="fragment">Tout changement dans l'entrée crée un <span class="highlight">hash complètement différent</span></li>
              <li class="fragment">Fonction à sens unique (irréversible)</li>
              <li class="fragment">Taille de sortie fixe (256 bits)</li>
            </ul>
            <div class="fragment" style="margin-top: 30px;">
              <h4>Exemple :</h4>
              <p><strong>Entrée :</strong> "Hello World"</p>
              <p><strong>SHA-256 :</strong> <span class="block-hash">a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e</span></p>
              <p><strong>Entrée :</strong> "Hello World!"</p>
              <p><strong>SHA-256 :</strong> <span class="block-hash">7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</span></p>
            </div>
          </section>

          <!-- Mining and Proof of Work -->
          <section>
            <h2>Minage et Proof of work</h2>
            <ul>
              <li class="fragment">Les mineurs rivalisent pour résoudre des <span class="highlight">énigmes informatiques</span></li>
              <li class="fragment">Trouver un nonce qui fait commencer le hash du bloc par des zéros</li>
              <li class="fragment">Nécessite une <span class="highlight">puissance de calcul</span> importante</li>
              <li class="fragment">Le premier à résoudre peut ajouter le bloc et gagner une récompense</li>
            </ul>
            <div class="fragment" style="margin-top: 30px;">
              <h4>Processus de Minage classique :</h4>
              <ol>
                <li>Collecter les transactions en attente</li>
                <li>Essayer différentes valeurs de nonce</li>
                <li>Calculer le hash jusqu'à atteindre la difficulté cible</li>
                <li>Diffuser la solution au réseau</li>
                <li>Le réseau valide et accepte le bloc</li>
              </ol>
            </div>
          </section>

          <!-- Ethereum proof of stake -->
          <section>
            <h2>Ethereum Proof of Stake</h2>
            <ul>
              <li class="fragment">Ethereum a migré vers un modèle de <span class="highlight">Proof of Stake (PoS)</span></li>
              <li class="fragment">Les validateurs sont choisis en fonction de la quantité d'Ether qu'ils détiennent et sont prêts à "staker"</li>
              <li class="fragment"> Le PoS est plus <span class="highlight">énergétiquement efficace</span> que le PoW</li>
              <li class="fragment"> Les validateurs sont récompensés pour leur participation et pénalisés pour les comportements malveillants</li>
            </ul>
            <div class="fragment" style="margin-top: 15px;">
              <h4>Processus de Validation PoS :</h4>
              <ol>
                <li>Les utilisateurs "stakent" leur Ether</li>
                <li>Les validateurs sont sélectionnés aléatoirement pour proposer de nouveaux blocs</li>
                <li>Les blocs proposés sont validés par d'autres validateurs</li>
                <li>Les blocs validés sont ajoutés à la blockchain</li>
                <li>Les validateurs reçoivent des récompenses en Ether</li>
              </ol>
            </div>
          </section>

          <!-- Decentralized Network -->
          <section>
            <h2>Réseau Décentralisé</h2>
            <div style="text-align: center;">
              <div class="network-node consensus-animation">Node</div>
              <div class="network-node consensus-animation">Node</div>
              <div class="network-node consensus-animation">Node</div>
              <div class="network-node consensus-animation">Node</div>
              <div class="network-node consensus-animation">Node</div>
            </div>
            <ul style="margin-top: 30px;">
              <li class="fragment">Chaque nœud maintient une <span class="highlight">copie complète</span> de la blockchain</li>
              <li class="fragment">Les nœuds communiquent en p2p (peer-to-peer)</li>
              <li class="fragment">Les mécanismes de consensus assurent l'accord</li>
            </ul>
          </section>

          <!-- Consensus Mechanisms -->
          <section>
            <h2>Résumé des mécanismes de consensus</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="fragment">
                <h4>Preuve de Travail (PoW)</h4>
                <ul>
                  <li>Énigmes computationnelles</li>
                  <li>Intensive en énergie</li>
                  <li>Utilisée par Bitcoin</li>
                  <li>Haute sécurité</li>
                </ul>
              </div>
              <div class="fragment">
                <h4>Proof Of Stake (PoS)</h4>
                <ul>
                  <li>Validateurs choisis par enjeu</li>
                  <li>Efficace énergétiquement</li>
                  <li>Utilisée par Ethereum 2.0</li>
                  <li>Incitations économiques</li>
                </ul>
              </div>
            </div>
            <div class="fragment" style="margin-top: 30px;">
              <h4>Autres Mécanismes :</h4>
              <p>Preuve d'Enjeu Déléguée (DPoS), Preuve d'Autorité (PoA), Tolérance aux Pannes Byzantines Pratique (pBFT)</p>
            </div>
          </section>

          <!-- Transaction Process -->
          <section>
            <h2>Processus de Transaction</h2>
            <ol>
              <li class="fragment"><strong>Initier :</strong> L'utilisateur crée et signe la transaction</li>
              <li class="fragment"><strong>Diffuser :</strong> La transaction est envoyée au réseau</li>
              <li class="fragment"><strong>Validation :</strong> Les nœuds vérifient la validité de la transaction</li>
              <li class="fragment"><strong>Mempool :</strong> Les transactions valides attendent dans le pool de mémoire</li>
              <li class="fragment"><strong>Minage :</strong> Les mineurs incluent les transactions dans de nouveaux blocs</li>
              <li class="fragment"><strong>Confirmation :</strong> Le bloc est ajouté à la chaîne et propagé</li>
              <li class="fragment"><strong>Finalité :</strong> La transaction devient immuable</li>
            </ol>
          </section>

          <!-- Immutability -->
          <section>
            <h2>Immuabilité et Sécurité</h2>
            <h4>Pourquoi la Blockchain est Sécurisée :</h4>
            <ul>
              <li class="fragment">Le <span class="highlight">hachage cryptographique</span> lie tous les blocs</li>
              <li class="fragment">Changer un bloc nécessite de changer <span class="highlight">tous les blocs suivants</span></li>
              <li class="fragment">Il faudrait contrôler la <span class="highlight">majorité du réseau</span> (attaque 51%)</li>
              <li class="fragment">Devient exponentiellement plus difficile avec le temps</li>
            </ul>
            <div class="fragment" style="margin-top: 30px;">
              <h4>Scénario d'Attaque :</h4>
              <p>Pour altérer le Bloc 2, l'attaquant doit :</p>
              <ol>
                <li>Recalculer le hash du Bloc 2</li>
                <li>Recalculer le hash du Bloc 3 (contient le hash du Bloc 2)</li>
                <li>Continuer pour tous les blocs suivants</li>
                <li>Faire cela plus rapidement que le réseau honnête</li>
              </ol>
            </div>
          </section>

          <!-- Smart Contracts -->
          <section>
            <h2>Contrats Intelligents</h2>
            <ul>
              <li class="fragment"><span class="highlight">Contrats auto-exécutables</span> avec des termes directement écrits dans le code</li>
              <li class="fragment">S'exécutent automatiquement lorsque les conditions sont remplies</li>
              <li class="fragment">Éliminent le besoin d'intermédiaires</li>
              <li class="fragment">Transparents et immuables</li>
            </ul>
            <div class="fragment" style="margin-top: 30px;">
              <h4>Exemples de Cas d'Usage :</h4>
              <ul>
                <li>Finance Décentralisée (DeFi)</li>
                <li>Traçabilité de la chaîne d'approvisionnement</li>
                <li>Réclamations d'assurance</li>
                <li>Systèmes de vote</li>
                <li>Identité numérique</li>
              </ul>
            </div>
          </section>

          <!-- Types of Blockchains -->
          <section>
            <h2>Types de Blockchains</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
              <div class="fragment">
                <h4>Blockchain Publique</h4>
                <ul>
                  <li>Ouverte à tous</li>
                  <li>Entièrement décentralisée</li>
                  <li>Exemples : Bitcoin, Ethereum</li>
                </ul>
              </div>
              <div class="fragment">
                <h4>Blockchain Privée</h4>
                <ul>
                  <li>Accès restreint</li>
                  <li>Contrôlée par une organisation</li>
                  <li>Plus rapide et efficace</li>
                  <li>Exemples : Hyperledger</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Advantages -->
          <section>
            <h2>Avantages de la Blockchain</h2>
            <ul>
              <li class="fragment"><strong>Décentralisation :</strong> Aucun point de défaillance unique</li>
              <li class="fragment"><strong>Transparence :</strong> Toutes les transactions sont visibles</li>
              <li class="fragment"><strong>Immuabilité :</strong> Les enregistrements ne peuvent être modifiés</li>
              <li class="fragment"><strong>Sécurité :</strong> Protection cryptographique</li>
              <li class="fragment"><strong>Confiance :</strong> Pas besoin d'intermédiaires</li>
              <li class="fragment"><strong>Accès Global :</strong> Disponibilité 24/7</li>
              <li class="fragment"><strong>Programmabilité :</strong> Les contrats intelligents permettent l'automatisation</li>
            </ul>
          </section>

          <!-- Challenges -->
          <section>
            <h2>Défis Actuels</h2>
            <ul>
              <li class="fragment"><strong>Évolutivité :</strong> Transactions par seconde limitées (Bitcoin: 10 minutes, Ethereum: 12 secondes)</li>
              <li class="fragment"><strong>Consommation d'Énergie :</strong> Le minage PoW nécessite beaucoup d'énergie</li>
              <li class="fragment"><strong>Réglementation :</strong> Cadres juridiques peu clairs</li>
              <li class="fragment"><strong>Expérience Utilisateur :</strong> Complexe pour les utilisateurs moyens</li>
              <li class="fragment"><strong>Stockage :</strong> La taille de la blockchain augmente continuellement (Bitcoin: 640GB, Ethereum 1.3TB)</li>
              <li class="fragment"><strong>Interopérabilité :</strong> Les différentes chaînes ne communiquent pas bien</li>
            </ul>
          </section>

          <!-- Real-World Applications -->
          <section>
            <h2>Applications du Monde Réel</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
              <div class="fragment">
                <h4>Finance</h4>
                <ul>
                  <li>Crypto-monnaies</li>
                  <li>Paiements internationaux</li>
                </ul>
              </div>
              <div class="fragment">
                <h4>Chaîne d'Approvisionnement</h4>
                <ul>
                  <li>Traçage des produits</li>
                  <li>Vérification d'authenticité</li>
                  <li>Assurance qualité</li>
                </ul>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
              <div class="fragment">
                <h4>Santé</h4>
                <ul>
                  <li>Dossiers médicaux</li>
                  <li>Traçabilité des médicaments</li>
                  <li>Partage de données de recherche</li>
                </ul>
              </div>
              <div class="fragment">
                <h4>Identité et Vote</h4>
                <ul>
                  <li>Identité numérique</li>
                  <li>Diplômes académiques</li>
                  <li>Systèmes de vote sécurisés</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Conclusion -->
          <section>
            <h2>Points Clés à Retenir</h2>
            <ul>
              <li class="fragment">La blockchain est un <span class="highlight">registre distribué et immuable</span></li>
              <li class="fragment">La sécurité provient de la <span class="highlight">cryptographie et du consensus</span></li>
              <li class="fragment">Élimine le besoin d'<span class="highlight">intermédiaires de confiance</span></li>
              <li class="fragment">Permet la <span class="highlight">monnaie programmable</span> et l'automatisation</li>
              <li class="fragment">Continue d'évoluer avec des solutions aux limitations actuelles</li>
              <li class="fragment">Potentiel de révolutionner de nombreuses industries</li>
            </ul>
            <p class="fragment" style="text-align: center; margin-top: 30px;">
              <small>Questions?</small>
            </p>
            <p class="fragment" style="text-align: center; margin-top: 50px;">
              <strong style="font-size: 1.5em; color: #FFD700;">Démonstration!</strong><br>
            </p>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .presentation-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    :host ::ng-deep .reveal .slides section {
      text-align: left;
      font-size: 0.8em;
    }

    :host ::ng-deep .reveal h1 {
      text-align: center;
      color: #FFD700;
      font-size: 2.2em;
    }

    :host ::ng-deep .reveal h2 {
      text-align: center;
      color: #FFD700;
      font-size: 1.8em;
    }

    :host ::ng-deep .reveal h3 {
      text-align: center;
      color: #FFD700;
      font-size: 1.4em;
    }

    :host ::ng-deep .reveal h4 {
      color: #FFD700;
      font-size: 1.2em;
    }

    :host ::ng-deep .reveal p {
      font-size: 0.9em;
      line-height: 1.4;
    }

    :host ::ng-deep .reveal ul {
      font-size: 0.85em;
    }

    :host ::ng-deep .reveal ol {
      font-size: 0.85em;
    }

    :host ::ng-deep .reveal li {
      margin-bottom: 0.3em;
    }

    :host ::ng-deep .reveal small {
      font-size: 0.7em;
    }

    :host ::ng-deep .blockchain-block {
      background: linear-gradient(45deg, #1e3c72, #2a5298);
      border: 2px solid #FFD700;
      border-radius: 10px;
      padding: 20px;
      margin: 10px;
      display: inline-block;
      position: relative;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    :host ::ng-deep .block-hash {
      font-family: monospace;
      font-size: 0.8em;
      color: #00ff00;
      word-break: break-all;
    }

    :host ::ng-deep .arrow {
      font-size: 2em;
      color: #FFD700;
      margin: 0 10px;
    }

    :host ::ng-deep .highlight {
      background-color: #FFD700;
      color: #000;
      padding: 2px 4px;
      border-radius: 3px;
    }

    :host ::ng-deep .network-node {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: radial-gradient(circle, #4CAF50, #2E7D32);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 10px;
      color: white;
      font-weight: bold;
    }

    :host ::ng-deep .consensus-animation {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    :host ::ng-deep .reveal {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
  `]
})
export class BlockchainPresentationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revealContainer', { static: true }) revealContainer!: ElementRef;

  ngOnInit() {
    this.loadRevealJS();
  }

  ngAfterViewInit() {
    // Delay initialization to ensure Reveal.js is loaded
    setTimeout(() => {
      this.initializeReveal();
    }, 500);
  }

  ngOnDestroy() {
    if (typeof Reveal !== 'undefined' && Reveal.isReady()) {
      Reveal.destroy();
    }
  }

  private loadRevealJS() {
    // Load Reveal.js CSS
    this.loadCSS('https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css');
    this.loadCSS('https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/black.css');
    this.loadCSS('https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/highlight/monokai.css');

    // Load Reveal.js JS
    this.loadScript('https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js')
      .then(() => this.loadScript('https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/notes/notes.js'))
      .then(() => this.loadScript('https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/markdown/markdown.js'))
      .then(() => this.loadScript('https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/highlight/highlight.js'))
      .then(() => {
        console.log('Reveal.js scripts loaded successfully');
      })
      .catch(error => {
        console.error('Error loading Reveal.js scripts:', error);
      });
  }

  private loadCSS(href: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  private initializeReveal() {
    if (typeof Reveal !== 'undefined') {
      try {
        Reveal.initialize({
          hash: true,
          transition: 'slide',
          transitionSpeed: 'default',
          backgroundTransition: 'fade',
          controls: true,
          progress: true,
          center: true,
          touch: true,
          loop: false,
          rtl: false,
          fragments: true,
          embedded: false,
          help: true,
          showNotes: false,
          autoSlide: 0,
          autoSlideStoppable: true,
          mouseWheel: false,
          hideAddressBar: true,
          previewLinks: false,
          viewDistance: 3,
          parallaxBackgroundImage: '',
          parallaxBackgroundSize: '',
          parallaxBackgroundHorizontal: null,
          parallaxBackgroundVertical: null
        });
        console.log('Reveal.js initialized successfully');
      } catch (error) {
        console.error('Error initializing Reveal.js:', error);
      }
    } else {
      console.error('Reveal.js not loaded');
    }
  }
}
