// script.js
const socket = io();
let currentEncryptedMessage = null;

// Elementos DOM
const statusElement = document.getElementById('status');
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');

// Configurar navegación por pestañas
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        showTab(tabName);
    });
});

function showTab(tabName) {
    // Actualizar pestañas
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    
    // Actualizar paneles
    tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === tabName);
    });
}

// Manejo de conexión WebSocket
socket.on('connect', () => {
    statusElement.textContent = 'Conectado al servidor';
    statusElement.className = 'connection-status connected';
});

socket.on('disconnect', () => {
    statusElement.textContent = 'Desconectado del servidor';
    statusElement.className = 'connection-status error';
});

socket.on('newEncryptedMessage', (data) => {
    console.log('Nuevo mensaje cifrado recibido:', data);
    currentEncryptedMessage = data.encryptedText;
    
    // Actualizar la interfaz
    document.getElementById('receivedMessage').textContent = currentEncryptedMessage;
    document.getElementById('publicMessage').textContent = currentEncryptedMessage;
    
    // Mostrar notificación si no está en la vista pública
    if (!document.getElementById('display').classList.contains('active')) {
        showNotification('Nuevo mensaje cifrado recibido');
    }
});

// Algoritmo de Cifrado César ASCII Corregido
function asciiCaesarCipher(str, key, decrypt = false) {
    const ASCII_MIN = 32;   // Espacio
    const ASCII_MAX = 126;  // ~
    const RANGE_SIZE = ASCII_MAX - ASCII_MIN + 1; // 95 caracteres
    
    // Ajustar clave para descifrado
    if (decrypt) {
        key = -key;
    }
    
    // Normalizar la clave al rango [0, RANGE_SIZE-1]
    key = ((key % RANGE_SIZE) + RANGE_SIZE) % RANGE_SIZE;
    
    let result = '';
    
    for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        
        // Solo procesar caracteres en el rango ASCII imprimible
        if (charCode >= ASCII_MIN && charCode <= ASCII_MAX) {
            // Normalizar a [0, RANGE_SIZE-1]
            let normalized = charCode - ASCII_MIN;
            // Aplicar desplazamiento con módulo
            let newPosition = (normalized + key) % RANGE_SIZE;
            // Convertir de vuelta a ASCII
            let newCharCode = newPosition + ASCII_MIN;
            result += String.fromCharCode(newCharCode);
        } else {
            // Mantener caracteres fuera del rango
            result += str[i];
        }
    }
    
    return result;
}

// Función para cifrar mensaje
function encryptMessage() {
    const message = document.getElementById('inputText').value.trim();
    const keyInput = document.getElementById('encryptionKey').value;
    const key = parseInt(keyInput);
    
    // Validaciones
    if (!message) {
        showStatus('Por favor ingrese un mensaje', 'error');
        return;
    }
    
    if (!keyInput || isNaN(key)) {
        showStatus('Por favor ingrese una clave numérica válida', 'error');
        return;
    }
    
    if (key < 0 || key > 255) {
        showStatus('La clave debe estar entre 0 y 255', 'error');
        return;
    }
    
    // Cifrar el mensaje
    const encrypted = asciiCaesarCipher(message, key);
    
    // Enviar al servidor
    socket.emit('messageEncrypted', {
        encryptedText: encrypted,
        timestamp: new Date().toLocaleTimeString(),
        keyUsed: key
    });
    
    showStatus(`Mensaje cifrado y transmitido correctamente (Clave: ${key})`, 'success');
    
    // Limpiar campos
    document.getElementById('inputText').value = '';
    document.getElementById('encryptionKey').value = '';
}

// Función para descifrar mensaje
function decryptMessage() {
    if (!currentEncryptedMessage) {
        showStatus('No hay mensajes cifrados recibidos', 'error');
        return;
    }
    
    const keyInput = document.getElementById('decryptionKey').value;
    const key = parseInt(keyInput);
    
    if (!keyInput || isNaN(key)) {
        showStatus('Por favor ingrese una clave numérica válida', 'error');
        return;
    }
    
    // Descifrar el mensaje
    const decrypted = asciiCaesarCipher(currentEncryptedMessage, key, true);
    document.getElementById('decryptedResult').textContent = decrypted;
    
    showStatus('Mensaje descifrado correctamente', 'success');
}

// Utilidades de UI
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('encryptedStatus');
    statusElement.textContent = message;
    
    // Reset classes
    statusElement.className = 'status-message';
    
    // Añadir clase de tipo si es específico
    if (type === 'error') {
        statusElement.style.borderLeftColor = 'var(--warning-color)';
    } else if (type === 'success') {
        statusElement.style.borderLeftColor = 'var(--success-color)';
    }
}

function showNotification(message) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 1rem;
        border-radius: 6px;
        box-shadow: var(--shadow);
        z-index: 1000;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Enfocar el primer campo de entrada
    const firstInput = document.querySelector('input, textarea');
    if (firstInput) {
        firstInput.focus();
    }
});