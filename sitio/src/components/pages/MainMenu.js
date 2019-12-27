import React,{Component} from 'react';
import OptionBox from '../optinBox';
import '../../css/MainMenu.css';
import historial from '../historial';

class MainMenu extends Component
{

    cuestionariosHandler = e => {
        historial.push('/test-menu')
    }

    render(){
        const logo_cuestionarios = <i className="fas fa-clipboard-list"></i>;
        const logo_admin = <i className="fas fa-cog"></i>;
        return(
            <React.Fragment>
                <div id="options-page">
                    <OptionBox onClick={this.cuestionariosHandler} option_name={"Cuestionarios"} logo={logo_cuestionarios} />
                    <OptionBox onClick={() => {historial.push('/results')}} option_name={"Administrar"} logo={logo_admin}/>
                </div>
            </React.Fragment>
        );
    }
}

export default MainMenu;