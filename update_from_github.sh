#!/bin/bash
# ================================================================
# SentinelPC / Control_PC - Script de Atualizacao via GitHub
# Repositorio: https://github.com/wsmigas/Control_PC.git
# Diretoria:   /opt/control_pc
# ================================================================

set -e

echo "[1/5] A aceder a /opt/control_pc..."
cd /opt/control_pc

# Configurar remote se necessario
if [ ! -d ".git" ]; then
    echo "[!] Repositorio Git nao inicializado. A clonar..."
    git clone https://github.com/wsmigas/Control_PC.git .
else
    git remote set-url origin https://github.com/wsmigas/Control_PC.git || git remote add origin https://github.com/wsmigas/Control_PC.git
fi

echo "[2/5] A descarregar alteracoes do GitHub (git pull origin main)..."
git fetch origin main || git fetch origin master || true
git pull origin main || git pull origin master || true

echo "[3/5] A instalar dependencias com --legacy-peer-deps..."
npm install --legacy-peer-deps --no-audit

echo "[4/5] A compilar versao de producao (npm run build)..."
npm run build

echo "[5/5] A reiniciar servico systemd control_pc..."
if systemctl is-active --quiet control_pc; then
    systemctl restart control_pc
    echo "[✓] Servico control_pc reiniciado com sucesso!"
else
    echo "[i] O servico systemd nao esta ativo ou em execucao. A iniciar se aplicavel..."
    systemctl start control_pc 2>/dev/null || true
fi

echo "================================================================"
echo "[✓] Atualizacao concluida com sucesso a partir de github.com/wsmigas/Control_PC!"
echo "================================================================"
