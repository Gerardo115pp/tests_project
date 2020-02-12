import React,{Component} from 'react';
import {connect} from 'react-redux';
import SettingsNavModal from '../settingsNavModal';
import CreateNewProfile from '../CreateNewProfile';
import UTModal from '../unfinishedTests';
import historial from '../historial';
import * as intervieweeActions from '../../actions/intervieweeActions';
import * as utActions from '../../actions/utActions';
import { isBlock } from '@babel/types';
import { server_name } from '../../serverInfo';
import '../../css/TestMenu.css';

class TestMenu extends Component
{

    showing_uts = false;
    unfinished_tests = []; // the ut info is stored here
    selected_profile_id = null;

    state = {
        list_needed_tests: [],
        needed_tests: {},
        unfinished_tests: false, //true only if the server says that there are ut(unfinished tests) created by the current user
        profiles: [] // this is a list that will contain the profiles that will be displayed gotten by 'getUserProfilesAsJSX'
    }


    requestUserProfiles = () => {
        const { user_id } = this.props.user;
        fetch(`${server_name}getSimpleUserProfiles/${user_id}`)
            .then(promise => promise.json())
            .then(response => {
                if (response.response === "ok")
                {
                    if (response.profiles !== undefined)
                    {
                        this.setState({
                            profiles: response.profiles
                        })
                    }
                }
            })
    }

    getUserProfilesAsJSX = () => {
        const { profiles } = this.state;
        if(profiles.length > 0)
        {
            const profiles_jsx = []
            let key_counter = 0;
            profiles.forEach(profile => {
                profiles_jsx.push(<option key={`profile_${key_counter}`} profile_name={profile.name} value={`${key_counter}`}>{profile.name}</option>);
                key_counter++;
            })
            return profiles_jsx;
        }
        return "You havent created any profiles";
    }

    componentDidMount()
    {
        /**
         * we are check if there are any unfinished test created by user that were no completed.
         * if so, then we set 'this.unfinished_test=response.cached' which means that now 'this.unfinished_test' contains
         * a list with all the  unfinished test and the requierd data to resume them (one at the time). then this.state.unfinished_tests
         * (this.unfinished !== this.state.unfinished) is set to true, so the components get loaded in the render().
         * 
         * we call for the profiles the user has created.
         */

        const { unfinished_tests } = this.state;

        if(!unfinished_tests)
        {
            const { user_id } = this.props.user;
            const forma = new FormData();
            forma.append('user', user_id);

            const request = new Request(`${server_name}getCatchedInterviews`, {method: 'POST', body: forma});
            fetch(request)
                .then(promise => promise.json())
                .then(response => {
                    if(response.cached.length > 0)
                    {
                        this.unfinished_tests = response.cached;
                        // console.log(JSON.stringify(this.unfinished_tests));
                        this.setState({
                            unfinished_tests: true
                        })
                    }
                })
        }
        if(this.state.profiles.length === 0)
        {
            this.requestUserProfiles();
        } 
    }

    backArrowHandler = e => {
        historial.push('/main-menu')
    }

    checkSelectIndex = () => {
        /**
         * checks if the user selects customs interview, this function will be removed, is just a hot fix
         */
        const { profiles } = this.state;
        const select_tag = document.getElementById('test-type-selector');
        this.selected_profile_id = profiles[select_tag.selectedIndex].profile_id
        this.getSelectedTests(profiles[select_tag.selectedIndex].needed_tests)
    }

    getSelectedTests = list => {
        /**
         * callback used by the ModalTest
         */
        this.setState({
            list_needed_tests:list
        })
    } 

    proceedToTests = async () => {
        
        /**
         *
         * Sends the data of the interviewed to the server, and requests the needed tests, then proceeds to the
         * interviews page.
         */
        const interviewee_name = document.getElementById('nombre-input').value;
        const { list_needed_tests } = this.state;
        if (interviewee_name.length > 0 && list_needed_tests.length > 0)
        {
            this.props.clearUTdata();
            let forma = new FormData();
            forma.append('name',interviewee_name);
            forma.append('needed',JSON.stringify(list_needed_tests));
            forma.append('user_id', this.props.user.user_id);
            forma.append('profile_id', this.selected_profile_id);
            let request = new Request(`${server_name}createNewInterview`,{method: 'POST',body:forma});
            const namer_tag = document.getElementById('nombre-input').value;
            await fetch(request)
                    .then(promise => promise.json())
                    .then(result => {
                        if(!result.error)
                        {
                            this.props.setInterviewee(result.tests,namer_tag,result.interviewee_key,result.interview_key);
                            historial.push('/interviews');
                        }
                    })
        }
        
        
        
    }

    showUtsModal = () => {
        /**
         * show the ut modal if there are more the one ut if there is only one then it directly resumes that ut
         */
        if(this.unfinished_tests.length === 1)
        {
            return this.resumeUT(0)
        }
        const element = document.getElementById('select-ut-modalbackground');
        if(!this.showing_uts)
        {
            element.style.display = 'block';
        }
        else
        {
            element.removeAttribute('style');
        }
        this.showing_uts = !this.showing_uts;
    }

    openUserSettingsNav = () => {
        const element = document.getElementById('settings-nav-background');
        if(element !== undefined)
        {
            element.style.display = 'block';
        }
    }

    resumeUT = index => {
        /**
         * if the server says that there is ut created by the user, then it sets it in the redux store and proceeds to the 
         * interviews components
         */
        if(this.state.unfinished_tests)
        {
            const ut = this.unfinished_tests[index];
            this.props.setUT(ut);
            this.props.setInterviewee(ut.tests, ut.interviewee_name, ut.interviewee, ut.interview)
            historial.push('/interviews')
        }
    }

    render(){
        let content = "";
        if (this.unfinished_tests.length > 0) // Create th ut botton if there are any uts
        {
            content = (<div id="unfinished-tests-modal-container">
                            <h5>Tienes entrevistas sin terminar</h5>
                       </div>)
        }

        const profiles_options = this.getUserProfilesAsJSX();

        return(
            <React.Fragment>
                <CreateNewProfile callback={this.requestUserProfiles} />
                <SettingsNavModal />
                <UTModal hiddingCallback={this.showUtsModal} uts={this.unfinished_tests} callback={this.resumeUT} />
                {/* <ModalTests callback={this.getSelectedTests} use_id={'tests-modal-container'} /> */}
                <div id='main-container'>
                    <div id="tests-menu-controls">
                        <span onClick={this.backArrowHandler} id='back-arrow'><i className="fas fa-arrow-left"></i></span>
                        <span onClick={this.openUserSettingsNav} id='settings-btn'><i className="fas fa-user-cog"></i></span>
                    </div>
                    <div id="options-page" className="non-vertical">
                        <div id="form-options-container">
                            <div id="form-title-container">
                                <h1 className="form-title">Nuevo entrevistado</h1>
                            </div>
                            <fieldset id="inputs-container">
                                <div className='form-input-container'>
                                    <label htmlFor="nombre-input">nombre</label>
                                    <input type="text" id="nombre-input"/>
                                </div>
                                <div className='form-input-container'>
                                    <label htmlFor="test-type-selector">tipo de entrevista</label>
                                    <select onChange={this.checkSelectIndex} name="tts" id="test-type-selector">
                                        {profiles_options}
                                    </select>
                                </div>
                            </fieldset>
                            <div id="ok-btn-container">
                                <button id="test-menu-ok-btn" onClick={this.proceedToTests}>OK</button>
                            </div>
                        </div>
                        <div onClick={this.showUtsModal} id="unfinished-tests-modal-btn-container">
                            {content}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    showModal = (modal_id) => {
        /**
         * (Deprecated) Show and hides any modal
         */
        const modal = document.getElementById(modal_id);
        if(isBlock(modal))
        {
            modal.style.display = 'none';
        }
        else
        {
            modal.style.display = 'block';
        }
    }
}

const mapStateToProps = reducers => {
    return {
        interviewee: reducers.intervieweeReducer,
        ut: reducers.utReducer,
        user: reducers.userReducer
    }
}

const mapDispatchToProps = dispatch => {
    return {
        'setInterviewee':(tests,namer_tag,interviewee_key,interview_key) => dispatch(intervieweeActions.setInterviewee(tests,namer_tag,interviewee_key,interview_key)),
        'setUT': ut => dispatch(utActions.setUT(ut)),
        'clearUTdata': () => dispatch(utActions.clearUTdata())
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(TestMenu);