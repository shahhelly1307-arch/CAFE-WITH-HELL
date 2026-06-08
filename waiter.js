/**
 * Waiter NPC — carries and delivers the exact food item the user ordered from the menu.
 */

let waiterGroup = null;
let trayGroup = null;
let waiterHome = { x: -1.0, y: 0.14, z: -1.0 };
let isDelivering = false;

function createWaiter() {
    const waiter = createRealisticPerson({
        skinColor: 0xd4a574,
        shirtColor: 0xffffff,
        pantsColor: 0x1a1a1a,
        hairColor: 0x1a1008,
        scale: 1.05
    });

    // Server vest & bow tie
    const vest = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.42, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 })
    );
    vest.position.set(0, 1.05, 0.1);
    waiter.add(vest);

    const tie = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.1, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 })
    );
    tie.position.set(0, 1.32, 0.14);
    waiter.add(tie);

    trayGroup = new THREE.Group();
    trayGroup.name = 'waiterTray';
    trayGroup.position.set(0.35, 0.95, 0.25);
    const tray = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16),
        new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 })
    );
    tray.rotation.x = -0.2;
    trayGroup.add(tray);
    waiter.add(trayGroup);

    const rSh = waiter.getObjectByName('rightShoulder');
    if (rSh) rSh.rotation.set(-1.4, -0.3, 0.1);
    const lSh = waiter.getObjectByName('leftShoulder');
    if (lSh) lSh.rotation.set(-1.2, 0.2, -0.2);

    return waiter;
}

function createFoodProp(category) {
    const food = new THREE.Group();
    food.name = 'foodProp';
    const cat = category === 'coffee' ? 'brews' : category;

    if (cat === 'brews') {
        const saucer = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.01, 16),
            new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.4 })
        );
        food.add(saucer);
        const cup = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.035, 0.08, 12),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        cup.position.y = 0.045;
        food.add(cup);
        const coffee = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.034, 0.02, 12),
            new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.6 })
        );
        coffee.position.y = 0.075;
        food.add(coffee);
        const handle = new THREE.Mesh(
            new THREE.TorusGeometry(0.025, 0.006, 6, 12, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        handle.rotation.y = Math.PI / 2;
        handle.position.set(0.05, 0.04, 0);
        food.add(handle);
    } else if (cat === 'elixirs') {
        const glass = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.14, 12),
            new THREE.MeshStandardMaterial({ color: 0xd6ecef, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.5 })
        );
        glass.position.y = 0.07;
        food.add(glass);
        const liquid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.038, 0.048, 0.1, 12),
            new THREE.MeshStandardMaterial({ color: 0x4a9e5c, transparent: true, opacity: 0.8, emissive: 0x2d6b3a, emissiveIntensity: 0.3 })
        );
        liquid.position.y = 0.06;
        food.add(liquid);
        const straw = new THREE.Mesh(
            new THREE.CylinderGeometry(0.004, 0.004, 0.12, 4),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        straw.position.set(0.02, 0.12, 0);
        straw.rotation.z = 0.15;
        food.add(straw);
    } else {
        const plate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.015, 16),
            new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.5 })
        );
        food.add(plate);
        const pastry = new THREE.Mesh(
            new THREE.TorusGeometry(0.05, 0.018, 8, 16, Math.PI * 1.4),
            new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.65 })
        );
        pastry.position.y = 0.03;
        pastry.rotation.x = Math.PI / 2;
        food.add(pastry);
    }

    food.scale.setScalar(1.4);
    return food;
}

function initWaiter(deck1Group) {
    waiterGroup = createWaiter();
    waiterGroup.position.set(waiterHome.x, waiterHome.y, waiterHome.z);
    waiterGroup.rotation.y = Math.PI / 3;
    deck1Group.add(waiterGroup);
    window.waiterGroup = waiterGroup;
}

function clearTray() {
    if (!trayGroup) return;
    const old = trayGroup.getObjectByName('foodProp');
    if (old) trayGroup.remove(old);
}

function placeFoodOnTray(order) {
    clearTray();
    if (!order || !trayGroup) return;
    const food = createFoodProp(order.category);
    food.position.set(0, 0.06, 0);
    food.rotation.x = -0.15;
    trayGroup.add(food);
}

function deliverOrderToTable(tableId, order) {
    if (!waiterGroup || isDelivering) return;
    const table = window.tableRegistry?.[tableId];
    if (!table) return;

    isDelivering = true;
    placeFoodOnTray(order);

    const wp = new THREE.Vector3();
    table.group.getWorldPosition(wp);
    const deckY = 7.5;
    const targetLocal = table.group.position.clone();
    const approach = targetLocal.clone();
    approach.z += 1.2;

    const walk = (props, dur) => new Promise(res => {
        if (!window.gsap) { Object.assign(waiterGroup.position, props); res(); return; }
        gsap.to(waiterGroup.position, { ...props, duration: dur, ease: 'power1.inOut', onComplete: res });
    });

    const turn = (y, dur) => new Promise(res => {
        if (!window.gsap) { waiterGroup.rotation.y = y; res(); return; }
        gsap.to(waiterGroup.rotation, { y, duration: dur, ease: 'power1.inOut', onComplete: res });
    });

    (async () => {
        await walk({ x: approach.x, y: 0.2, z: approach.z }, 1.8);
        await turn(Math.atan2(targetLocal.x - approach.x, targetLocal.z - approach.z), 0.5);
        await walk({ x: targetLocal.x + 0.5, y: 0.2, z: targetLocal.z + 0.6 }, 1.2);

        // Place food on table
        const food = createFoodProp(order.category);
        food.name = 'foodProp';
        food.position.set(0.15, 0.92, 0);
        table.group.add(food);
        food.userData.orderName = order.name;
        clearTray();

        // Brief pause then return
        await new Promise(r => setTimeout(r, 1200));
        await turn(Math.PI / 3, 0.4);
        await walk({ x: waiterHome.x, y: waiterHome.y, z: waiterHome.z }, 1.8);

        isDelivering = false;
        if (window.onWaiterDelivered) window.onWaiterDelivered(order, tableId);
    })();
}

window.initWaiter = initWaiter;
window.placeFoodOnTray = placeFoodOnTray;
window.deliverOrderToTable = deliverOrderToTable;
window.createFoodProp = createFoodProp;
