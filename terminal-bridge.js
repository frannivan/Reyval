/**
 * REYVAL PRO TERMINAL BRIDGE v4.0
 * Advanced Process Manager for Dev, Git & Cloud Ops
 * Run once with: /usr/local/bin/node terminal-bridge.js
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 3030;
const processes = {
    frontend: { child: null, state: 'stopped', logs: [] },
    backend: { child: null, state: 'stopped', logs: [] },
    git_push: { child: null, state: 'stopped', logs: [] },
    server_deploy: { child: null, state: 'stopped', logs: [] }
};

const clients = new Set();
const SSH_KEY = "/Users/franivan/Documents/ProyectosWeb/AbTech/ssh-key-2026-01-09.key";
const REMOTE = "ubuntu@143.47.101.209";

function broadcast(type, data) {
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => client.write(payload));
}

function addLog(app, content) {
    const logEntry = {
        time: new Date().toLocaleTimeString(),
        content: content.toString().trim()
    };
    processes[app].logs.push(logEntry);
    if (processes[app].logs.length > 1000) processes[app].logs.shift();
    broadcast('log', { app, ...logEntry });
}

function updateState(app, state) {
    processes[app].state = state;
    broadcast('state-change', { app, state });
}

function runCommand(app, cmd, args, cwd) {
    if (processes[app].state === 'running') {
        addLog(app, `[Warning] ${app} is already running.`);
        return;
    }

    addLog(app, `Executing: ${cmd} ${args.join(' ')}`);
    updateState(app, 'running');

    const child = spawn(cmd, args, {
        cwd: path.join(__dirname, cwd),
        shell: true,
        detached: true,
        stdio: 'pipe'
    });

    child.on('error', (err) => {
        addLog(app, `[ERR] Failure starting process: ${err.message}`);
        updateState(app, 'stopped');
    });

    child.stdout.on('data', (data) => addLog(app, data));
    child.stderr.on('data', (data) => addLog(app, `[ERR] ${data}`));

    child.on('close', (code) => {
        updateState(app, 'stopped');
        processes[app].child = null;
        addLog(app, `Process completed with code ${code}`);
    });

    processes[app].child = child;
}

function stopProcess(app) {
    if (processes[app].child) {
        addLog(app, `Sending kill signal to ${app}...`);
        try {
            // Kill the entire process group (negative PID)
            process.kill(-processes[app].child.pid, 'SIGINT');
            addLog(app, `SIGINT sent to process group.`);
        } catch (err) {
            addLog(app, `[ERR] Failed to kill process: ${err.message}`);
            // Fallback to normal kill if group kill fails
            processes[app].child.kill('SIGKILL');
        }
    }
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/events') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.write('\n');
        clients.add(res);
        res.write(`event: init\ndata: ${JSON.stringify({
            frontend: { state: processes.frontend.state },
            backend: { state: processes.backend.state },
            git_push: { state: processes.git_push.state },
            server_deploy: { state: processes.server_deploy.state }
        })}\n\n`);
        req.on('close', () => clients.delete(res));
        return;
    }

    const app = url.searchParams.get('app');
    const cmdType = url.searchParams.get('cmd');
    const msg = url.searchParams.get('msg') || 'automated-update';

    if (url.pathname === '/run') {
        if (app === 'frontend') runCommand('frontend', 'npm', ['start'], 'frontend');
        else if (app === 'backend') runCommand('backend', 'npm', ['run', 'dev'], 'backend-api');
        else if (app === 'git_push') {
            const safeMsg = msg.replace(/"/g, '\\"');
            runCommand('git_push', `git add . && git commit -m "${safeMsg}" && git push origin main`, [], '.');
        }
        else if (app === 'server_deploy') {
            const deployCmd = `ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${REMOTE} "cd /home/ubuntu/Reyval && git pull && sudo bash deploy.sh"`;
            runCommand('server_deploy', deployCmd, [], '.');
        }
        res.end('OK');
        return;
    }

    if (url.pathname === '/stop') {
        if (processes[app]) stopProcess(app);
        res.end('OK');
        return;
    }

    res.statusCode = 404;
    res.end();
});

server.listen(PORT, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `┌──────────────────────────────────────────┐`);
    console.log(`\x1b[36m%s\x1b[0m`, `│  REYVAL PRO BRIDGE v4.0 ACTIVE           │`);
    console.log(`\x1b[36m%s\x1b[0m`, `│  Port: ${PORT}                              │`);
    console.log(`\x1b[36m%s\x1b[0m`, `└──────────────────────────────────────────┘`);
});
