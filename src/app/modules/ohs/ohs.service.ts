import { Injectable } from '@angular/core';
import { ChecklistItem } from './ohs.model';

@Injectable({
  providedIn: 'root'
})
export class OhsService {

  constructor() { }

  getChecklist(discipline: string): ChecklistItem[] {
    switch (discipline) {
      case 'chemicals':
        return this.getChemicalsChecklist();
      case 'energy':
        return this.getEnergyChecklist();
      case 'equipment':
        return this.getEquipmentChecklist();
      case 'safeguards':
        return this.getSafeguardsChecklist();
      case 'hazards':
        return this.getHazardsChecklist();
      case 'general':
        return this.getGeneralChecklist();
      default:
        return [];
    }
  }

  private getChemicalsChecklist(): ChecklistItem[] {
    return [
      { id: 1, question: 'Are hazardous substances handled only by authorised personnel in accordance with prescribed controls?', critical: false, comments: '' },
      { id: 2, question: 'Does the worker obtain, read, and follow the Safety Data Sheet (SDS) instructions?', critical: false, comments: '' },
      { id: 3, question: 'Has the worker been trained in the use, handling, storage, and disposal of the specific chemicals?', critical: false, comments: '' },
      { id: 4, question: 'Is a hot work permit issued and is continuous LEL gas monitoring used when ignition sources are near flammable materials?', critical: true, comments: '' },
      { id: 5, question: 'Are appropriate personal gas detection monitors worn, and do workers evacuate if alarms sound?', critical: true, comments: '' },
      { id: 6, question: 'Are explosives storage areas only accessed by authorised persons?', critical: false, comments: '' },
      { id: 7, question: 'Is the blast danger zone evacuated before blasting, and is the material checked for misfires before loading?', critical: true, comments: '' },
      // CCV
      { id: 8, question: 'Does the worker understand the health hazards, reactivity, and flammability of the chemicals?', critical: false, comments: '' },
      { id: 9, question: 'Is the worker wearing the correct PPE for the specific task?', critical: false, comments: '' },
      { id: 10, question: 'Does the team understand the procedure for finding unknown substances?', critical: false, comments: '' },
      { id: 11, question: 'Are chemicals compatible with their storage containers, and are containers/pipes labelled legibly?', critical: false, comments: '' },
      { id: 12, question: 'Is the delivery driver following safe loading/unloading practices, and have truck contents been verified?', critical: false, comments: '' },
      { id: 13, question: 'Are substances stored and segregated according to SDS requirements?', critical: false, comments: '' }
    ];
  }

  private getEnergyChecklist(): ChecklistItem[] {
    return [
      { id: 1, question: 'Are all energy sources (electrical, mechanical, hydraulic, etc.) identified and isolated?', critical: true, comments: '' },
      { id: 2, question: 'Is stored energy discharged prior to starting work?', critical: true, comments: '' },
      { id: 3, question: 'Are personal locks and tags used on all isolation points?', critical: true, comments: '' },
      { id: 4, question: 'Is isolation effectiveness verified via a "bump test" for a zero energy state?', critical: true, comments: '' },
      { id: 5, question: 'Are guards and safety systems restored after work is completed?', critical: false, comments: '' },
      // CCV
      { id: 6, question: 'Have locks and tags been installed so they cannot be bypassed or defeated?', critical: true, comments: '' },
      { id: 7, question: 'Are deadman switches, emergency stops, and pull cords confirmed functional?', critical: false, comments: '' },
      { id: 8, question: 'Does the work plan specifically address the reinstallation of guards before returning to service?', critical: false, comments: '' }
    ];
  }

  private getEquipmentChecklist(): ChecklistItem[] {
    return [
      { id: 1, question: 'Are traffic rules obeyed and is driving adapted to road conditions?', critical: false, comments: '' },
      { id: 2, question: 'Are safety devices (seatbelts, backup alarms, strobe lights, kill switches) functional and used?', critical: true, comments: '' },
      { id: 3, question: 'Are cell phones or electronic devices (excluding approved radios) avoided during operation?', critical: false, comments: '' },
      { id: 4, question: 'Are loads and loose items secured?', critical: false, comments: '' },
      { id: 5, question: 'Is movement prevented when parking using wheel chocks, parking ditches, or berms?', critical: false, comments: '' },
      { id: 6, question: 'Do pedestrians stand clear of the travel path and operating radius?', critical: false, comments: '' },
      // CCV
      { id: 7, question: 'Is the team member alert, rested, and free of distractions?', critical: false, comments: '' },
      { id: 8, question: 'Has interaction between vehicles and pedestrians been minimised by physical barriers or exclusion zones?', critical: false, comments: '' },
      { id: 9, question: 'Are berms built with competent material to the mid-axle height of the largest vehicle?', critical: false, comments: '' },
      { id: 10, question: 'Is positive two-way communication established when passing equipment or entering exclusion zones?', critical: false, comments: '' },
      { id: 11, question: 'Is the equipment fitted with an appropriate fire suppression system or extinguisher, and has it been inspected?', critical: false, comments: '' }
    ];
  }

  private getSafeguardsChecklist(): ChecklistItem[] {
    return [
      { id: 1, question: 'Are only authorised personnel allowed to alter, bypass, or remove safeguards?', critical: false, comments: '' },
      { id: 2, question: 'Is equipment operated according to manufacturer specs with safeguards in place?', critical: false, comments: '' },
      { id: 3, question: 'Are tools disconnected when not in use or during servicing?', critical: false, comments: '' },
      { id: 4, question: 'Are emergency shutoffs clearly identified, visible, and accessible?', critical: false, comments: '' },
      // CCV
      { id: 5, question: 'Is an exclusion zone demarcated with hazard and precautionary actions identified?', critical: false, comments: '' },
      { id: 6, question: 'Is the worker clear of potential line of fire situations?', critical: false, comments: '' },
      { id: 7, question: 'Are there designated covered walkways under conveyor belts?', critical: false, comments: '' },
      { id: 8, question: 'Have individuals performed effective mechanical blocking using approved blocks?', critical: false, comments: '' },
      { id: 9, question: 'Are articulation and bed locks in place during maintenance?', critical: false, comments: '' }
    ];
  }

  private getHazardsChecklist(): ChecklistItem[] {
    return [
      { id: 1, question: 'Does the worker use their Stop Unsafe Work Authority?', critical: false, comments: '' },
      { id: 2, question: 'Is a hazard assessment conducted prior to starting work?', critical: false, comments: '' },
      { id: 3, question: 'Are risks minimised to As Low As Reasonably Practicable (ALARP)?', critical: false, comments: '' },
      { id: 4, question: 'Is a formal Management of Change (MOC) initiated when necessary?', critical: false, comments: '' }
    ];
  }

  private getGeneralChecklist(): ChecklistItem[] {
    return [
      { id: 1, question: 'Is the worker fit for duty and unaffected by fatigue, medication, or drugs?', critical: false, comments: '' },
      { id: 2, question: 'Do they work according to established job instructions and know emergency procedures?', critical: false, comments: '' },
      { id: 3, question: 'Safety signs, PPE availability, and functional fire alarms/first aid kits.', critical: false, comments: '' },
      { id: 4, question: 'Walkways and floors clean and free of debris.', critical: false, comments: '' },
      { id: 5, question: 'Lifting equipment (cranes/hoists) certified and load limits marked.', critical: false, comments: '' },
      { id: 6, question: 'Electrical wiring condition and proper labelling of panels.', critical: false, comments: '' },
      { id: 7, question: 'Slope stability (checking for cracks or sliding) and ground control measures (mesh/bolts).', critical: false, comments: '' },
      { id: 8, question: 'Traffic management (haul road maintenance and speed limits).', critical: false, comments: '' }
    ];
  }
}