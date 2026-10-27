import { applySettings, decodeSettings, defaultSettings, needsRestart, settingFields, storageKey, validateSettings } from './settings';
import type { SimulationConfig } from './simulation';

export function createSettingsPanel(config:SimulationConfig,restart:()=>void,initialMessage:string) {
  let values=Object.fromEntries(settingFields.map(f=>{
    const [group,key]=f.path.split('.');
    return [f.path,key?(config as unknown as Record<string,Record<string,number>>)[group][key]:(config as unknown as Record<string,number>)[group]];
  }));
  let paused=false;
  const toolbar=document.createElement('div');toolbar.className='settings-toolbar';
  const toggle=document.createElement('button');toggle.textContent='Settings';toggle.setAttribute('aria-expanded','false');
  const pause=document.createElement('button');pause.textContent='Pause';pause.setAttribute('aria-pressed','false');
  toolbar.append(toggle,pause);
  const dialog=document.createElement('dialog');dialog.className='settings-panel';dialog.id='simulation-settings';
  toggle.setAttribute('aria-controls',dialog.id);
  const title=document.createElement('h2');title.textContent='Tune the savannah';title.id='settings-title';dialog.setAttribute('aria-labelledby',title.id);
  const intro=document.createElement('p');intro.textContent='Rates use simulated seconds. Apply changes to tune this world. Timing settings marked “restart” wait for a new world. Opening this menu does not pause the simulation.';
  const close=document.createElement('button');close.textContent='Close';close.type='button';close.className='settings-close';
  const form=document.createElement('form');form.noValidate=true;
  const inputs=new Map<string,HTMLInputElement>();
  for(const group of [...new Set(settingFields.map(f=>f.group))]) {
    const section=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=group;section.append(legend);
    for(const f of settingFields.filter(f=>f.group===group)) {
      const row=document.createElement('label');row.className='setting-row';
      const name=document.createElement('span');name.textContent=f.label+(f.restart?' · restart':'');
      const input=document.createElement('input');input.type='number';input.min=String(f.min);input.max=String(f.max);input.step=String(f.step);input.value=String(values[f.path]);input.name=f.path;
      const hint=document.createElement('small');hint.id=`setting-${f.path}`;hint.textContent=`${f.description} Default: ${defaultSettings()[f.path]}.`;
      input.setAttribute('aria-describedby',hint.id);row.append(name,input,hint);section.append(row);inputs.set(f.path,input);
    }
    form.append(section);
  }
  const status=document.createElement('p');status.setAttribute('role','status');status.className='settings-message';status.textContent=initialMessage;
  const apply=document.createElement('button');apply.type='submit';apply.textContent='Apply & save';
  const reset=document.createElement('button');reset.type='button';reset.textContent='Reset defaults';
  const restartButton=document.createElement('button');restartButton.type='button';restartButton.textContent='Apply & restart world';
  const warning=document.createElement('p');warning.textContent='Restart resets animals, resources and the clock. It does not save or resume a world.';
  const actions=document.createElement('div');actions.className='settings-actions';actions.append(apply,reset,restartButton);
  form.append(actions,warning,status);dialog.append(close,title,intro,form);document.body.append(toolbar,dialog);
  const save=()=>{
    try {localStorage.setItem(storageKey,JSON.stringify({version:1,values}));return 'Settings saved on this browser.';}
    catch {return 'Browser storage unavailable. Settings apply for this session only.';}
  };
  const commit=()=>{
    const candidate=Object.fromEntries([...inputs].map(([path,input])=>[path,input.value===''?NaN:Number(input.value)]));
    const error=validateSettings(candidate);
    if(error) {status.textContent=error;return false;}
    values=candidate;applySettings(config,values);
    status.textContent=save()+(needsRestart(config,values)?' Timing changes pending restart.':' Live changes applied.');return true;
  };
  form.onsubmit=event=>{event.preventDefault();commit();};
  reset.onclick=()=>{const defaults=defaultSettings();inputs.forEach((input,path)=>input.value=String(defaults[path]));commit();};
  restartButton.onclick=()=>{
    // Apply the current form first, avoiding silently discarding an edit.
    if(!commit()) return;
    applySettings(config,values,true);restart();status.textContent='World restarted. '+save();
  };
  const closePanel=()=>{dialog.close();toggle.setAttribute('aria-expanded','false');toggle.focus();};
  close.onclick=closePanel;
  dialog.addEventListener('cancel',event=>{event.preventDefault();closePanel();});
  toggle.onclick=()=>{dialog.showModal();toggle.setAttribute('aria-expanded','true');};
  // The toolbar remains visible; a second pause control is available inside the modal.
  const menuPause=document.createElement('button');menuPause.type='button';menuPause.textContent='Pause simulation';dialog.insertBefore(menuPause,form);
  const changePause=()=>{paused=!paused;pause.textContent=paused?'Resume · paused':'Pause';menuPause.textContent=paused?'Resume simulation':'Pause simulation';pause.setAttribute('aria-pressed',String(paused));menuPause.setAttribute('aria-pressed',String(paused));};
  pause.onclick=changePause;menuPause.onclick=changePause;
  return {isPaused:()=>paused,dispose(){dialog.remove();toolbar.remove();}};
}
export function loadSettings(config:SimulationConfig) {
  try {applySettings(config,decodeSettings(localStorage.getItem(storageKey)),true);return 'Saved settings loaded, or defaults if none were valid.';}
  catch {return 'Browser storage unavailable. Using defaults for this session.';}
}
