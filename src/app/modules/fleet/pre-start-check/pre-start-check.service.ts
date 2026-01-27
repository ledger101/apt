import { Injectable } from '@angular/core';
import { PreStartCheckItem } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class PreStartCheckService {

  constructor() { }

  getChecklist(): PreStartCheckItem[] {
    return [
      // Safety Devices
      { section: 'Safety Devices', question: 'Check Flashing Beacon Operating', response: 'yes', critical: false },
      { section: 'Safety Devices', question: 'Check HI Vis Aerial (Flag)', response: 'yes', critical: false },
      { section: 'Safety Devices', question: 'Check Horn Operation', response: 'yes', critical: false },
      { section: 'Safety Devices', question: 'Seatbelts Working and in Good Condition', response: 'yes', critical: false },
      { section: 'Safety Devices', question: 'Audible Reverse Alarm Functioning', response: 'yes', critical: false },
      { section: 'Safety Devices', question: 'Check Jack, Vehicle Tools and Spares Tyre Condition', response: 'yes', critical: false },
      { section: 'Safety Devices', question: 'Hazard Warning Triangles, First Aid Kit (Available & in Date)', response: 'yes', critical: false },
      { section: 'Safety Devices', question: 'Check Vehicle Chocks (2 Available and Serviceable)', response: 'yes', critical: false },
      { section: 'Safety Devices', question: 'Is Fire Extinguisher Fully Charged, Certified & Secure', response: 'yes', critical: false },
      // Under Bonnet
      { section: 'Under Bonnet', question: 'Check Engine Oil Level', response: 'yes', critical: false },
      { section: 'Under Bonnet', question: 'Check Brake Fluid Level (Visual Do Not Remove Cap)', response: 'yes', critical: false },
      { section: 'Under Bonnet', question: 'Check Radiator Coolant Level (Cold Start Only)', response: 'yes', critical: false },
      { section: 'Under Bonnet', question: 'Check Clutch Fluid Level (Visual Do Not Remove Cap)', response: 'yes', critical: false },
      { section: 'Under Bonnet', question: 'Check Battery Terminal Condition (Cables Tight and Secure)', response: 'yes', critical: false },
      { section: 'Under Bonnet', question: 'Check Windscreen Washer Fluid Level', response: 'yes', critical: false },
      // External
      { section: 'External', question: 'Check Parking, Indicator, Tail & Brake Light Function', response: 'yes', critical: false },
      { section: 'External', question: 'Check Headlight Function', response: 'yes', critical: false },
      { section: 'External', question: 'Check Tyres for Correct Pressure, Tread Wear & any Defects', response: 'yes', critical: false },
      { section: 'External', question: 'Check Wheel Nuts for Security (all nuts fitted, no studs sheared)', response: 'yes', critical: false },
      { section: 'External', question: 'Check Windscreen for Cracks, Damages Etc.', response: 'yes', critical: false },
      { section: 'External', question: 'Check for Damage to Bodywork, Panels (Dents, Scratches)', response: 'yes', critical: false },
      { section: 'External', question: 'Check yellow wheel nut markers are correctly fitted (if out of alignment immediately get the vehicle checked at LV Workshop or Tyre Bay)', response: 'yes', critical: false },
      // Internal
      { section: 'Internal', question: 'Check Foot Brake Operation', response: 'yes', critical: false },
      { section: 'Internal', question: 'Check Hand (Park) Brake Operation', response: 'yes', critical: false },
    ];
  }
}