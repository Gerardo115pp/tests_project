import React, { useState } from 'react';
import historial from './historial';
import * as serverInfo from '../serverInfo';
import '../css/SettingsNavModal.css';


/**
 *
 * this is the nav side bar in the TestMenu
 *
 */



function SettingsNavModal(props)
{

    
    const [ token_giver_style, setTokenGiverStyle ] = useState({
        display: 'none'
    }) 
    const [token_data, setTokenData ] = useState("Creando Token");
    
    const handleTokenCreation = token => {
        setTokenGiverStyle({
            ...token_giver_style,
            display:'block'
        })
        setTokenData(`${serverInfo.served_on}?token=${token}`);
    }

    const handleUserClickBackground = e => {
        const element = e.target;
        if( element.getAttribute('id') === 'settings-nav-background')
        {
            element.removeAttribute('style');
        }
    }

    const hideSelf = () => {
        const self = document.getElementById("settings-nav-background");
        self.style.display = "none";
    }

    const showCreateNewProfileForm = () => {
        const element = document.getElementById('newprofile-modal-background');
        element.style.display = 'block';
    }

    const handelTokenClicked = e => {
        const { target:token_element } = e;
        token_element.select();
        document.execCommand('copy');
    }

    const showTokensInfoModal = () => {
        props.tokensRefreshCallback();
    }

    return(
        <React.Fragment>
            <div onClick={handleUserClickBackground} id="settings-nav-background">
                <div style={token_giver_style} id="token-giver">
                    <input onClick={handelTokenClicked} id="token-container" value={token_data} readOnly/>
                </div>
                <div id="settings-nav-modal">
                    <div id="settings-nav-title">
                        <h4>Opciones</h4>
                    </div>
                    <div id="settings-nav-options">
                        <div onClick={showCreateNewProfileForm} className="settings-nav-option">
                            <h5>Crear perfil</h5>
                        </div>
                        <div onClick={e => props.intervieweeCreator(e,true, handleTokenCreation)} className="settings-nav-option">
                            <h5>Crear Test-Token</h5>
                        </div>
                        <div onClick={e => {
                                hideSelf();
                                props.showCreateTestUI();
                                }
                            }
                            className="settings-nav-option">
                            <h5>Crear Escala</h5>
                        </div>
                        <div onClick={showTokensInfoModal} className="settings-nav-option">
                            <h5>Tokens creados</h5>
                        </div>
                        <div onClick={() => historial.push('/results')} className="settings-nav-option">
                            <h5>Ir a resultados</h5>
                        </div>
                    </div>
                </div>

            </div>
        </React.Fragment>
    )
}

export default SettingsNavModal;