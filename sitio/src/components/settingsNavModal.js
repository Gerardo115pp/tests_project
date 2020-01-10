import React from 'react';
import CreateNewProfile from './CreateNewProfile';
import '../css/SettingsNavModal.css';

function SettingsNavModal(props)
{

    const handleUserClickBackground = e => {
        const element = e.target;
        console.log(element)
        if( element.getAttribute('id') === 'settings-nav-background')
        {
            element.removeAttribute('style');
        }
    }

    const showCreateNewProfileForm = () => {
        const element = document.getElementById('newprofile-modal-background');
        element.style.display = 'block';
    }

    return(
        <React.Fragment>
            <CreateNewProfile />
            <div onClick={handleUserClickBackground} id="settings-nav-background">
                <div id="settings-nav-modal">
                    <div id="settings-nav-title">
                        <h4>Opciones</h4>
                    </div>
                    <div id="settings-nav-options">
                        <div onClick={showCreateNewProfileForm} className="settings-nav-option">
                            <h5>Crear perfil</h5>
                        </div>
                        <div className="settings-nav-option">
                            <h5>Ir a resultados</h5>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default SettingsNavModal;