# Proposition formelle – Expérimentation technologique

**Titre du projet** : Développement et implémentation de contrats intelligents sur la blockchain Ethereum

**Date de remise** : 14 avril 2025  
**Étudiant(e)** : Vincent Bureau  
**Dépôt Git** : https://github.com/HydroshieldMKII/veille-technologique-420-1SH-SW.git

---

# Introduction

Les contrats intelligents représentent une avancée majeure dans le domaine de la technologie blockchain. Ces programmes auto-exécutables fonctionnent sur la blockchain et permettent d'éliminer les intermédiaires traditionnels dans de nombreux secteurs. Introduits conceptuellement par Nick Szabo en 1993, bien avant la création de Bitcoin, ils n'ont gagné en popularité qu'avec l'émergence d'Ethereum en 2015 où l'applicatif est devenu concret.

Ce projet vise à explorer le développement et l'implémentation de contrats intelligents sur la blockchain Ethereum. Mon objectif est d'en apprendre sur cette technologie qui est au cœur de nombreuses applications décentralisées, en combinant programmation, cryptographie et concepts blockchain.

---

# Prérecherche

Avant de choisir ce sujet, j'ai exploré plusieurs technologies :

| Sujet exploré             | Résumé                                                                                     | Pourquoi non retenu/retenu                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **Contrats intelligents** | Programmes auto-exécutables sur blockchain qui révolutionnent les transactions numériques. | Sujet retenu : représente une avancée majeure et ouvre la voie à de nouveaux types d'application |
| **Reverse Proxy**         | Outils comme Nginx ou Traefik pour gérer le trafic et sécuriser les applications web.      | Technologie plus établie, moins innovante que les contrats intelligents.                         |
| **WebAssembly**           | Format binaire permettant d'exécuter du code à haute performance dans les navigateurs.     | Intéressant mais moins disruptif que la technologie blockchain.                                  |
| **Rust**                  | Langage de programmation moderne axé sur la sécurité et la performance.                    | Apprentissage trop complexe pour la durée du projet.                                             |
| **Kubernetes**            | Système d'orchestration de conteneurs pour automatiser le déploiement d'applications.      | Nécessite une infrastructure complexe                                                            |

## Ressources pour chaque sujet exploré

**Contrats intelligents** :

- [Ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/en/v0.8.17/)

**Reverse Proxy** :

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)

**WebAssembly** :

- [WebAssembly.org](https://webassembly.org/)
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/WebAssembly)

**Rust** :

- [Rust Programming Language](https://www.rust-lang.org/)
- [Rust by Example](https://doc.rust-lang.org/stable/rust-by-example/)

**Kubernetes** :

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Kubernetes by Example](https://kubernetes.io/docs/tutorials/)

Les contrats intelligents m'attirent particulièrement car ils représentent selon moi l'avenir des transactions sécurisées, tout en offrant un potentiel d'innovation dans de nombreux secteurs.

---

# Objectifs

Le projet a pour but de développer mes compétences dans la création et le déploiement de contrats intelligents.

Les objectifs:

- Comprendre les concepts fondamentaux de la blockchain et des contrats intelligents
- Apprendre le langage Solidity pour le développement d'un contrats sur Ethereum
- Développer et déployer un contrat intelligent simple sur un environnement local (Ganache)

L'idée est de créer un système fonctionnel qui pourrait servir de base pour une éventuelle applications plus complexes.

---

# Défis anticipés

Dans la réalisation du projet je prévois plusieurs défis :

**Défis techniques :**

- Comprendre le langage Solidity et ses particularités
- Comprendre les concepts de sécurité pour éviter les vulnérabilités courantes
- Gérer les limitations de la blockchain Ethereum (coût des transactions, vitesse)

**Défis logistiques :**

- Manque d'expertise initiale dans le domaine de la blockchain et des contrats intelligents
- Absence d'accès à un réseau Ethereum principal (mainnet) à cause des coûts de transactions réelles
- Configuration initiale potentiellement complexe de l'environnement de développement

**Défis conceptuels :**

- Assimiler rapidement les concepts cryptographiques de la blockchain
- Penser en termes de programmation décentralisée, qui diffère significativement de la programmation traditionnelle
- Concevoir un contrat intelligent véritablement utile et pertinent malgré sa simplicité

## Accessibilité des ressources

Toutes les ressources nécessaires au projet sont facilement accessibles :

- **Solidity** : langage open source avec documentation complète et gratuite
- **Remix IDE** : environnement de développement web accessible gratuitement sans installation
- **Ganache** : logiciel gratuit qui simule une blockchain Ethereum locale
- **web3.js** : bibliothèque JavaScript open source
- **Truffle/Hardhat** : frameworks de développement gratuits

Les tutoriels et la documentation pour ces outils sont abondants et de qualité, notamment sur Ethereum.org et GitHub

# Plan de réalisation

**Jour 1-2 : Apprentissage et configuration**

- Apprentissage des concepts blockchain et des contrats intelligents
- Installation et configuration de l'environnement de développement (Ganache, Remix IDE)
- Premiers tests avec du code Solidity simple

**Jour 3-5 : Développement du contrat intelligent**

- Conception d'un contrat simple (token ERC20 ou banque de citations)
- Implémentation du contrat en Solidity
- Tests préliminaires des fonctionnalités du contrat

**Jour 6-7 : Déploiement et tests**

- Déploiement du contrat sur l'environnement local Ganache
- Tests approfondis de toutes les fonctionnalités
- Identification et correction des problèmes de sécurité potentiels

**Jour 8-9 : Développement d'une interface utilisateur (optionnel)**

- Création d'une interface web simple pour interagir avec le contrat
- Intégration avec web3.js pour communiquer avec la blockchain depuis un navigateur
- Tests de l'interface avec des utilisateurs

**Jour 10 : Documentation et présentation**

- Finalisation de la documentation du code
- Préparation de la présentation et démonstration du projet

---

# Technologies et outils utilisés

- **Langage de programmation** : Solidity pour le contrat intelligent
- **Environnement de développement** : Remix IDE pour l'environnement de dévloppement et Ganache pour simuler une blockchain locale
- **Bibliothèques** : web3.js pour l'interaction avec les contrats depuis une interface web
- **Outils supplémentaires** : Truffle/Hardhat pour la gestion du projet (optionnel)

---

# Résultats attendus

Si tout se déroule comme prévu, j'aurai développé et déployé un contrat intelligent fonctionnel.

Le projet sera réussi si :

- Le contrat est correctement déployé sur Ganache sans erreurs
- Toutes les fonctionnalités prévues sont implémentées
- Le code est sécurisé contre les vulnérabilités courantes des contrats intelligents
- Je suis capable d'expliquer les concepts fondamentaux des contrats intelligents et leur fonctionnement

---

# Conclusion

Ce projet permet d'explorer une technologie révolutionnaire qui transforme déjà de nombreux secteurs d'activité. Les contrats intelligents représentent une étape importante vers la décentralisation des applications et l'automatisation des processus.

# Lien de recherche
- [Ethers.js](https://docs.ethers.org/v6/)
- [Solidity](https://docs.soliditylang.org/en/v0.8.30/)
- [OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20-supply)

# Problèmes rencontrés
- Déploiement du contrat avec Hardhat sur un domaine (RPC autre domaine)
- Gestion des array en Solidity
- Configuration des scripts (Disable automine)
