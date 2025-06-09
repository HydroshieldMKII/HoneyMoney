# Rapport du projet de développement d'un contrat intelligent

[!CAUTION]
Negative potential consequences of an action.

## Table des matières

## Introduction

## Explication du projet

Le projet HoneyMoney vise à démontrer la faisabilité de l'utilisation de la blockchain pour de la deFi (finance décentralisée) en démontrant les fonctionnalités et leur danger potentiel. Le tout est accèssible via une interface web pour les utilisateurs et un assistant AI qui résume les actions effectuées.

## Explication des fonctionnalités

Le contrat intelligent HoneyMoney est jeton ERC20 basé sur la blockchain Ethereum. Le contrat implémente la librairie OpenZeppelin pour garantir la sécurité et la conformité aux standards ERC20. Il permet de gérer des fonds de manière décentralisée, avec des fonctionnalités telles que le transfert de fonds, la création et la suppression de fonds. Le contrat ajoute finalement une fonctionnalité de gestion des utilisateurs, permettant de limiter les actions indiquées précédemment à des utilisateurs spécifiques que chacun peut gérer.

#### HoneyMoney Analyser

Une intelligence artificielle (Claude de Anthropic) est intégrée pour résumer les actions effectuées et analyser si des transactions suspectes ont été effectuées, les résultats sont publiés sur la plateform discord. La librairie OpenZeppelin et le contrat solidity fournissent des événements pour notifier et déclancher un webhook n8n. Cette action déclanche un workflow n8n qui recoit les événements du contrat, les envoi à l'IA pour analyse, génere un fichier HTML résumant la transaction et les envois sur la plateform discord.

![n8n-flow](/images/n8n-flow.png)

<div align="center">

*Workflow n8n*
</div>

![transaction1](/images/transaction-1.png)
![transaction2](/images/transaction-2.png)

<div align="center">

*Résumé de la transaction HTML*
</div>

![claude-recap-1](/images/claude-recap-1.png)
![claude-recap-2](/images/claude-recap-2.png)

<div align="center">

*Résumé de la transaction par Claude*
</div>

#### Transfert de fonds

En utilisant le contrat HoneyMoney, les utilisateurs peuvent transférer des fonds entre eux de manière sécurisée et transparente. Le contrat gère les soldes des utilisateurs et assure que les transferts respectent les règles de la blockchain. Il vérifie si l'un des deux utilisateurs est bloqué, et si c'est le cas, il n'effectue pas le transfert. Il vérifie également si l'utilisateur a suffisamment de fonds pour effectuer le transfert, et si c'est le cas, il met à jour les soldes des deux utilisateurs. 

#### Création de fonds

L'administrateur du contrat peut créer de nouveaux fonds en émettant des jetons ERC20. Cette fonctionnalité permet de réguler la quantité de fonds disponibles dans le système ou de résoudre d'éventuelles litiges en créant des fonds supplémentaires pour les utilisateurs concernés. La création de fonds est limitée à l'administrateur du contrat, garantissant ainsi un contrôle centralisé sur cette action.

#### Suppression de fonds

#### Gestion des utilisateurs

#### Visualisation des blocs sur la blockchain

#### Mise en pause du contrat

## Conclusion