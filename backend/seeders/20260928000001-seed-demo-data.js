'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Seed Bases
    await queryInterface.bulkInsert('bases', [
      { id: 1, name: 'Base Alpha', location: 'Northern Sector', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'Base Bravo', location: 'Southern Sector', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: 'Base Charlie', location: 'Eastern Command', created_at: new Date(), updated_at: new Date() }
    ], {});

    // 2. Seed Users
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const userPassword = await bcrypt.hash('Password@123', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'General John Doe',
        email: 'admin@military.gov',
        password_hash: adminPassword,
        role: 'ADMIN',
        base_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'Col. Alex Vance',
        email: 'commander.alpha@military.gov',
        password_hash: userPassword,
        role: 'BASE_COMMANDER',
        base_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: 'Col. Sarah Connor',
        email: 'commander.bravo@military.gov',
        password_hash: userPassword,
        role: 'BASE_COMMANDER',
        base_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        name: 'Col. Marcus Wright',
        email: 'commander.charlie@military.gov',
        password_hash: userPassword,
        role: 'BASE_COMMANDER',
        base_id: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        name: 'Lt. James Miller',
        email: 'logistics@military.gov',
        password_hash: userPassword,
        role: 'LOGISTICS_OFFICER',
        base_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // 3. Seed Equipment Types
    await queryInterface.bulkInsert('equipment_types', [
      { id: 1, name: 'Humvee Tactical Vehicle', category: 'Vehicles', description: 'High Mobility Multipurpose Wheeled Vehicle', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'M4A1 Carbine Rifle', category: 'Weapons', description: '5.56x45mm NATO air-cooled gas-operated rifle', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: '5.56mm NATO Ammunition Box', category: 'Ammunition', description: 'Standard 1000-round ammunition crate', created_at: new Date(), updated_at: new Date() },
      { id: 4, name: 'Tactical Radio Set AN/PRC-152', category: 'Communication Equipment', description: 'Handheld multiband tactical radio', created_at: new Date(), updated_at: new Date() },
      { id: 5, name: 'Modular Body Armor Vest', category: 'Protective Equipment', description: 'Level IV ballistic plate armor carrier', created_at: new Date(), updated_at: new Date() }
    ], {});

    // 4. Seed Purchases
    const todayStr = new Date().toISOString().split('T')[0];
    const prevDateStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await queryInterface.bulkInsert('purchases', [
      { id: 1, base_id: 1, equipment_type_id: 1, quantity: 20, purchase_date: prevDateStr, reference_number: 'PO-2026-001', remarks: 'Initial vehicle procurement for Base Alpha', created_by: 5, created_at: new Date(), updated_at: new Date() },
      { id: 2, base_id: 1, equipment_type_id: 2, quantity: 150, purchase_date: prevDateStr, reference_number: 'PO-2026-002', remarks: 'Standard rifle batch', created_by: 5, created_at: new Date(), updated_at: new Date() },
      { id: 3, base_id: 1, equipment_type_id: 3, quantity: 500, purchase_date: prevDateStr, reference_number: 'PO-2026-003', remarks: 'Ammo crates supply', created_by: 5, created_at: new Date(), updated_at: new Date() },
      { id: 4, base_id: 2, equipment_type_id: 2, quantity: 80, purchase_date: prevDateStr, reference_number: 'PO-2026-004', remarks: 'Base Bravo armament supply', created_by: 1, created_at: new Date(), updated_at: new Date() },
      { id: 5, base_id: 3, equipment_type_id: 4, quantity: 40, purchase_date: todayStr, reference_number: 'PO-2026-005', remarks: 'Comms equipment batch', created_by: 1, created_at: new Date(), updated_at: new Date() }
    ], {});

    // 5. Seed Transfers
    await queryInterface.bulkInsert('transfers', [
      { id: 1, from_base_id: 1, to_base_id: 2, equipment_type_id: 1, quantity: 5, transfer_date: todayStr, remarks: 'Reallocation of vehicles to Base Bravo', created_by: 5, created_at: new Date(), updated_at: new Date() },
      { id: 2, from_base_id: 1, to_base_id: 3, equipment_type_id: 2, quantity: 25, transfer_date: todayStr, remarks: 'Reinforcement armaments for Base Charlie', created_by: 5, created_at: new Date(), updated_at: new Date() }
    ], {});

    // 6. Seed Assignments
    await queryInterface.bulkInsert('assignments', [
      { id: 1, base_id: 1, equipment_type_id: 2, personnel_name: 'Sgt. Mark Davis', quantity: 1, assignment_date: todayStr, remarks: 'Assigned for patrol duty', created_by: 2, created_at: new Date(), updated_at: new Date() },
      { id: 2, base_id: 2, equipment_type_id: 1, personnel_name: 'Lt. Squad Alpha', quantity: 2, assignment_date: todayStr, remarks: 'Assigned for convoy escort', created_by: 3, created_at: new Date(), updated_at: new Date() }
    ], {});

    // 7. Seed Expenditures
    await queryInterface.bulkInsert('expenditures', [
      { id: 1, base_id: 1, equipment_type_id: 3, quantity: 50, expenditure_date: todayStr, reason: 'Live Firing Training Exercise', remarks: 'Expended during quarterly range practice', created_by: 2, created_at: new Date(), updated_at: new Date() }
    ], {});

    // 8. Seed Audit Logs
    await queryInterface.bulkInsert('audit_logs', [
      { id: 1, user_id: 1, action: 'SYSTEM_INITIALIZED', entity_type: 'SYSTEM', entity_id: null, details: 'Database seeded with default bases, users, and assets', ip_address: '127.0.0.1', created_at: new Date() }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('audit_logs', null, {});
    await queryInterface.bulkDelete('expenditures', null, {});
    await queryInterface.bulkDelete('assignments', null, {});
    await queryInterface.bulkDelete('transfers', null, {});
    await queryInterface.bulkDelete('purchases', null, {});
    await queryInterface.bulkDelete('equipment_types', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('bases', null, {});
  }
};
