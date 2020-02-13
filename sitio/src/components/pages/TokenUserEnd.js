import React from 'react';
import historial from '../historial';
import '../../css/TokenUserEnd.css';

function tokenUserEnd()
{
    historial.block()
    return (
        <div id="token-user-done">
            <div id="tud-content">
                <div id="nice-face-container">
                    <i className="far fa-laugh-beam"></i>
                </div>
                <div id="main-message-container">Genial, has terminado!</div>
                <div id="sub-msg-container">ahora puedes cerrar esta pestaña</div>
            </div>
        </div>
    );
}

export default tokenUserEnd;