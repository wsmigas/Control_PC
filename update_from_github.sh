#!/bin/bash
# ================================================================
# SentinelPC / Control_PC - Script de Atualizacao via GitHub
# Repositorio: https://github.com/wsmigas/Control_PC.git
# Diretoria:   Auto-detetada ou /opt/control_pc
# ================================================================

set -e

# 1. Determinar diretório do projeto
if [ -n "$1" ] && [ -d "$1" ]; then
    TARGET_DIR="$1"
elif [ -f "$(dirname "${BASH_SOURCE[0]}")/package.json" ]; then
    TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
elif [ -f "$PWD/package.json" ]; then
    TARGET_DIR="$PWD"
elif [ -d "/opt/control_pc" ]; then
    TARGET_DIR="/opt/control_pc"
else
    TARGET_DIR="$(pwd)"
fi

echo "[1/5] A aceder ao diretório da aplicação ($TARGET_DIR)..."
cd "$TARGET_DIR"

# 2. Configurar e sincronizar repositório Git
echo "[2/5] A sincronizar com GitHub (https://github.com/wsmigas/Control_PC.git)..."
if [ ! -d ".git" ]; then
    echo "       [i] Repositório Git não inicializado. A inicializar e associar ao GitHub..."
    git init
    git remote add origin https://github.com/wsmigas/Control_PC.git 2>/dev/null || git remote set-url origin https://github.com/wsmigas/Control_PC.git
else
    git remote set-url origin https://github.com/wsmigas/Control_PC.git 2>/dev/null || git remote add origin https://github.com/wsmigas/Control_PC.git
fi

# Preservar dados e configurações locais em backup temporário antes do reset
if [ -f "data/state.json" ]; then
    mkdir -p /tmp/control_pc_backup
    cp -f "data/state.json" /tmp/control_pc_backup/state.json
fi

# Descartar alterações de ficheiros locais temporários para evitar conflitos de merge
git stash --include-untracked 2>/dev/null || true

# Obter commits mais recentes da branch main
echo "       [+] A descarregar commits da branch main..."
git fetch origin main 2>/dev/null || git fetch --depth=10 origin main 2>/dev/null || git fetch origin master 2>/dev/null || git fetch --all 2>/dev/null

# Forçar atualização limpa para a versão mais recente do GitHub
git reset --hard FETCH_HEAD 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null || git checkout -B main origin/main

CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
echo "       [✓] Sincronizado com sucesso no commit: $CURRENT_COMMIT"

# Restaurar estado/base de dados local se necessário
if [ -f "/tmp/control_pc_backup/state.json" ] && [ ! -f "data/state.json" ]; then
    mkdir -p data
    cp -f /tmp/control_pc_backup/state.json data/state.json
fi

# 3. Instalar dependências
echo "[3/5] A verificar dependências (npm install --legacy-peer-deps)..."
npm install --legacy-peer-deps --no-audit

# 4. Compilar aplicação de produção
echo "[4/5] A compilar frontend e backend (npm run build)..."
npm run build

# Salvar carimbo da última atualização
mkdir -p data
echo "{\"lastUpdated\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"commit\":\"$CURRENT_COMMIT\"}" > data/last_update.json

# 5. Reiniciar o serviço do sistema
echo "[5/5] A verificar e reiniciar serviço de background..."
if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet control_pc; then
        echo "       [✓] A agendar reinício do serviço systemd 'control_pc' em 2 segundos..."
        (sleep 2 && systemctl restart control_pc 2>/dev/null) &
    elif systemctl is-active --quiet sentinel_pc; then
        echo "       [✓] A agendar reinício do serviço systemd 'sentinel_pc' em 2 segundos..."
        (sleep 2 && systemctl restart sentinel_pc 2>/dev/null) &
    else
        echo "       [i] Serviço systemd não ativo. O servidor em execução direta servirá os novos ficheiros compilados em dist/."
    fi
else
    echo "       [i] Sistema em execução direta (sem systemctl). Ficheiros compilados em dist/ atualizados."
fi

echo "================================================================"
echo "[✓] Atualização concluída com sucesso! (Versão: $CURRENT_COMMIT)"
echo "================================================================"
