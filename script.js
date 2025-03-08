// Centralized state management
const state = {
    users: JSON.parse(localStorage.getItem('users')) || [],
    ADMIN_CREDENTIALS: {
        email: 'admin@tradingpro.com',
        password: 'admin123'
    },
    assets: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'XAG/USD', 'BTC/USD'],
    signalInterval: null, // Store the interval ID
    currentUser: null,
    historicalPrices: {}, // Store historical prices for assets
    signals: [], // Store generated signals
    baseProbability: { // Base probabilities for each direction
        CALL: 0.55,
        PUT: 0.55
    }
};

// Utility Functions
const showElement = (elementId) => {
    document.getElementById(elementId).style.display = 'flex';
};

const hideElement = (elementId) => {
    document.getElementById(elementId).style.display = 'none';
};

const showError = (message) => {
    document.getElementById('error-message').textContent = message;
};

const saveUsersToLocalStorage = () => {
    localStorage.setItem('users', JSON.stringify(state.users));
};

// Authentication Functions
const toggleLogin = () => {
    showElement('login-overlay');
};

const handleLogin = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === state.ADMIN_CREDENTIALS.email && password === state.ADMIN_CREDENTIALS.password) {
        hideElement('login-overlay');
        showElement('admin-panel');
        loadUserList();
        return;
    }

    const user = state.users.find(u => u.email === email);

    if (!user) {
        showError('Email não cadastrado');
    } else if (!user.password) {
        setupPassword(email);
    } else if (user.password === password) {
        startSession(email);
    } else {
        showError('Senha incorreta');
    }
};

// Password Setup Screen
const setupPassword = (email) => {
    const overlay = document.getElementById('login-overlay');
    overlay.innerHTML = `
        <div class="auth-box">
            <h2>Criar Senha</h2>
            <input type="password" class="auth-input" id="new-password" placeholder="Nova Senha">
            <input type="password" class="auth-input" id="confirm-password" placeholder="Confirmar Senha">
            <button class="cta-btn" onclick="savePassword('${email}')">Salvar Senha</button>
            <p id="password-error" class="error-message"></p>
        </div>
    `;
};

// Save User Password
const savePassword = (email) => {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showError('Senhas não coincidem');
        return;
    }

    if (newPassword.length < 6) {
        showError('Senha mínima de 6 caracteres');
        return;
    }

    const userIndex = state.users.findIndex(u => u.email === email);
    state.users[userIndex].password = newPassword;
    saveUsersToLocalStorage();

    startSession(email);
};

// Start User Session
const startSession = (email) => {
    const user = state.users.find(u => u.email === email);

    if (!user) {
        console.error('Usuário não encontrado após a autenticação.');
        return;
    }

    if (user.licenseDays <= 0) {
        alert("Sua licença expirou. Contate o administrador.");
        return;
    }

    state.currentUser = user; // Store the logged-in user
    hideElement('login-overlay');
    document.querySelector('.hero').style.display = 'none';
    showElement('signal-page');

    document.querySelector('.logo').textContent = `TradingPro - ${email.split('@')[0].toUpperCase()}`;

    updateLicenseInfo();
    initializeSignalGeneration();
};

const updateLicenseInfo = () => {
    if (state.currentUser) {
        const expiryDate = new Date(state.currentUser.licenseExpiry);
        const timeLeft = expiryDate.getTime() - new Date().getTime();
        const daysLeft = Math.ceil(timeLeft / (1000 * 3600 * 24));

        if (daysLeft >= 0) {
            document.getElementById('license-info').textContent = `Licença válida por ${daysLeft} dias`;
        } else {
            document.getElementById('license-info').textContent = "Licença expirada";
            alert("Sua licença expirou. Contate o administrador.");
            logout();
        }
    }
};

const logout = () => {
    hideElement('signal-page');
    document.querySelector('.hero').style.display = 'block';
    clearInterval(state.signalInterval); // Clear the interval
    state.signalInterval = null; // Reset the interval ID
    state.currentUser = null;
    document.querySelector('.logo').textContent = 'TradingPro';
    window.location.reload(); // Consider alternative to reload
};

const closeAdmin = () => {
    hideElement('admin-panel');
};

const addUser = () => {
    const email = document.getElementById('new-user-email').value;
    const licenseDays = parseInt(document.getElementById('new-user-license').value);

    if (!email) {
        alert("Por favor, insira o email do novo usuário.");
        return;
    }

    if (state.users.find(u => u.email === email)) {
        alert("Este email já está cadastrado.");
        return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + licenseDays);

    const newUser = {
        email: email,
        password: null, // Senha será definida no primeiro login
        licenseDays: licenseDays,
        licenseExpiry: expiryDate.toISOString()
    };

    state.users.push(newUser);
    saveUsersToLocalStorage();
    loadUserList();
};

const deleteUser = (email) => {
    state.users = state.users.filter(user => user.email !== email);
    saveUsersToLocalStorage();
    loadUserList();
};

const loadUserList = () => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = `<strong>Usuários Cadastrados:</strong>`;

    state.users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.classList.add('user-list-item');
        userDiv.innerHTML = `
            <span>${user.email} ${user.password ? '✔️' : '⏳'} - Licença: ${new Date(user.licenseExpiry).toLocaleDateString()}</span>
            <button class="delete-button" onclick="deleteUser('${user.email}')">Excluir</button>
        `;
        userList.appendChild(userDiv);
    });
};

// ----- New Code ------

// Simulate API interaction (replace with actual API calls)
const simulateGetRealTimePrice = (asset) => {
    // In a real scenario, you would make an API request here
    // For demonstration purposes, we return a random number
    return parseFloat((Math.random() * 100 + 50).toFixed(2));
};

// Simulate "AI" analysis using real-time data
const analyzeMarketWithRealTimeData = (asset) => {
    // Get the latest price from the simulated API
    const currentPrice = simulateGetRealTimePrice(asset);
    const previousPrice = state.historicalPrices[asset] || currentPrice;

    // Basic trend analysis (replace with more sophisticated logic)
    let direction = (currentPrice >= previousPrice) ? 'CALL' : 'PUT'; // Basic trend analysis

    // Calculate a confidence level based on the strength of the trend
    let confidence = Math.abs(currentPrice - previousPrice) / currentPrice;

    // Update historical price
    state.historicalPrices[asset] = currentPrice;

    return {
        asset: asset,
        direction: direction,
        confidence: confidence, // Add confidence level
        currentPrice: currentPrice, // Include the current price in the analysis
        timestamp: new Date().getTime()
    };
};

// Calculate the time of the next minute
const getNextMinuteTime = () => {
    const now = new Date();
    const nextMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
    return nextMinute.getTime();
};

// Function to determine if a signal should be generated based on probability
const shouldGenerateSignal = (direction, confidence) => {
    const baseProbability = state.baseProbability[direction];
    const adjustedProbability = baseProbability + (confidence * 0.2); // Adjust probability based on confidence
    return Math.random() < adjustedProbability;
};

const generateDelayedSignal = () => {
    const asset = state.assets[Math.floor(Math.random() * state.assets.length)];
    const analysis = analyzeMarketWithRealTimeData(asset); // Use the function with real-time data
    const delay = Math.floor(Math.random() * (5 - 3 + 1)) + 3; // Random delay between 3 and 5 minutes
    const nextMinuteTime = getNextMinuteTime(); // Get the time of the next minute
    const signalTime = new Date(nextMinuteTime); // Use next minute time
    const displayTime = new Date(signalTime.getTime() + delay * 60000);

    // Check if a signal should be generated based on the probability
    if (shouldGenerateSignal(analysis.direction, analysis.confidence)) {
        const signal = {
            asset: analysis.asset,
            direction: analysis.direction,
            entryTime: signalTime.getTime(), // Time to execute the trade
            displayTime: displayTime.getTime(),
            analysisTime: analysis.timestamp, // Time of analysis
            analysisPrice: analysis.currentPrice, // Price at the time of analysis
            result: 'pending' // Initial state
        };

        state.signals.push(signal);
        console.log('Signal generated:', signal);

        // Schedule signal display
        setTimeout(() => {
            displaySignal(signal);
        }, delay * 60000);
    } else {
        console.log("Signal not generated due to low probability.");
    }
};

// Display the signal
const displaySignal = (signal) => {
    const nextTime = new Date(signal.displayTime);

    const signalDisplay = `
        <div class="signal-item">
            <div class="signal-header">
                <strong>${nextTime.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                })}</strong>
            </div>
            <div class="asset-badge" style="background: ${
                signal.asset === 'BTC/USD' ? '#f7931a' :
                signal.asset === 'XAU/USD' ? '#ffd700' :
                'var(--primary-gradient)'
            }">${signal.asset}</div>
            <div class="signal-direction" style="color: ${signal.direction === 'CALL' ? '#4ade80' : '#f87171'}">
                ${signal.direction} ${signal.direction === 'CALL' ? '▲' : '▼'}
            </div>
             <div class="signal-result pending">Aguardando Resultado</div>
        </div>
    `;

    const signalContainer = document.getElementById('signal-container');
    signalContainer.insertAdjacentHTML('afterbegin', signalDisplay);

    signal.displayElement = signalContainer.firstChild; // Store a reference to the displayed element for later updates

    const signals = signalContainer.children;
    if (signals.length > 8) {
        signals[8].remove();
    }

    // Schedule result determination based on the display time
    setTimeout(() => {
        determineSignalResult(signal);
    }, 60000); // Check result 1 minute after display
};

// Determine the result of the signal
const determineSignalResult = (signal) => {
    const currentTime = new Date();
    const timeDiff = currentTime.getTime() - signal.displayTime;
    const priceAtSignalTime = signal.analysisPrice; // Store the price at signal time
    const currentPrice = simulateGetRealTimePrice(signal.asset); // Get current price

    let result = 'pending';

    if (signal.direction === 'CALL' && currentPrice > priceAtSignalTime) {
        result = 'win';
    } else if (signal.direction === 'PUT' && currentPrice < priceAtSignalTime) {
        result = 'win';
    } else {
        result = 'loss';
    }

    signal.result = result;
    updateSignalDisplay(signal);
};

// Update the display with the signal result
const updateSignalDisplay = (signal) => {
    if (signal.displayElement) {
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('signal-result', signal.result);
        resultDiv.textContent = `Resultado: ${signal.result.toUpperCase()}`;
        signal.displayElement.appendChild(resultDiv);
    }
};

const initializeSignalGeneration = () => {
    // Generate the first signal immediately
    generateDelayedSignal();

    // Then, generate signals every 3 to 5 minutes
    state.signalInterval = setInterval(() => {
        generateDelayedSignal();
    }, (Math.floor(Math.random() * (5 - 3 + 1)) + 3) * 60000);
};

// ----- End New Code ------

// Initialization
window.onload = () => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) state.users = JSON.parse(storedUsers);

    if (state.users.length > 0) {
        state.users.forEach(user => {
            user.licenseExpiry = new Date(user.licenseExpiry);
        });
    }

    const loggedInUser = sessionStorage.getItem('user');
    if (loggedInUser) startSession(loggedInUser);

    if (document.getElementById('admin-panel').style.display === 'flex') {
        loadUserList();
    }
};