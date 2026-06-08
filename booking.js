/**
 * Click a highlighted table to book — waiter delivers your menu order.
 */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;
let selectedTable = null;

const infoName = document.getElementById('info-table-name');
const infoDetails = document.getElementById('info-table-details');
const successCard = document.getElementById('booking-success');
const selectedTableInput = document.getElementById('selected-table-id');
const bookAnotherBtn = document.getElementById('book-another-btn');

function initBookingSystem() {
    const canvas = document.getElementById('webgl-canvas');
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('pointerdown', onSceneClick);
    if (bookAnotherBtn) bookAnotherBtn.addEventListener('click', resetBookingUI);
}

function canInteract() {
    return window.bookingWalkReady || window.freeExploreMode ||
        document.getElementById('reserve-section')?.classList.contains('active');
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    checkHover();
}

function checkHover() {
    if (!canInteract()) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactiveTables.filter(o => o.userData.isTable));

    if (hits.length > 0) {
        const hit = hits[0].object;
        if (hit.userData.status === 'reserved') return;
        document.body.style.cursor = 'pointer';
        if (hoveredObject !== hit) {
            restoreHoveredMaterial();
            hoveredObject = hit;
            hoveredObject.material = hoveredObject.userData.hoverMaterial;
            if (!selectedTable) {
                infoName.innerText = hit.userData.name;
                const orderNote = window.userOrder
                    ? `<br><span style="color:#c2871b;">Your order: ${window.userOrder.name}</span>`
                    : '';
                infoDetails.innerHTML = `${hit.userData.details}${orderNote}<br>
                    <span style="color:#1b7340;font-weight:600;">● Click to reserve</span>`;
            }
        }
    } else {
        document.body.style.cursor = 'default';
        restoreHoveredMaterial();
    }
}

function restoreHoveredMaterial() {
    if (hoveredObject && hoveredObject !== selectedTable) {
        hoveredObject.material = hoveredObject.userData.originalMaterial;
        hoveredObject = null;
    }
}

function onSceneClick() {
    if (!canInteract()) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactiveTables.filter(o => o.userData.isTable));
    if (hits.length > 0 && hits[0].object.userData.status !== 'reserved') {
        completeInstantBooking(hits[0].object);
    }
}

function completeInstantBooking(tableMesh) {
    if (selectedTable && selectedTable !== tableMesh) {
        selectedTable.material = selectedTable.userData.originalMaterial;
    }
    selectedTable = tableMesh;
    selectedTableInput.value = tableMesh.userData.id;
    tableMesh.userData.status = 'reserved';

    const indicator = tableMesh.userData.indicatorMesh;
    const light = tableMesh.userData.lightSource;
    if (indicator) {
        indicator.material.color.setHex(0xff3333);
        indicator.material.emissive.setHex(0xaa1111);
    }
    if (light) light.color.setHex(0xff3333);
    tableMesh.material = tableMesh.userData.originalMaterial;

    const order = window.userOrder || { name: 'Filter Kaapi', waiterType: 'coffee' };
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const timeStr = now.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    infoName.innerText = tableMesh.userData.name;
    infoDetails.innerHTML = `<span style="color:#2e754e;font-weight:600;">✓ Reserved — waiter is on the way!</span>`;

    if (successCard) {
        successCard.classList.remove('hidden');
        document.getElementById('success-message').innerHTML = `
            Table <strong>${tableMesh.userData.name}</strong> is yours for <strong>${timeStr}</strong>.<br>
            Your waiter is bringing <strong>${order.name}</strong> now!
        `;
    }

    // Deliver food via waiter
    if (typeof deliverOrderToTable === 'function') {
        deliverOrderToTable(tableMesh.userData.id, {
            ...order,
            category: order.waiterType || order.category || 'coffee'
        });
    }

    const pos = new THREE.Vector3();
    tableMesh.getWorldPosition(pos);
    if (window.gsap && camera) {
        gsap.to(camera.position, {
            x: pos.x + 0.9, y: (window.EYE_HEIGHT || 9.15) + 0.05, z: pos.z + 1.1,
            duration: 1.0, ease: 'power2.out',
            onUpdate: () => camera.lookAt(pos.x, window.EYE_HEIGHT || 9.15, pos.z)
        });
    }
    hoveredObject = null;
}

function resetBookingUI() {
    if (successCard) successCard.classList.add('hidden');
    selectedTable = null;
    infoName.innerText = 'Choose Your Table';
    infoDetails.innerText = 'Click a highlighted table — your waiter will bring your order.';

    interactiveTables.forEach(obj => {
        if (obj.userData.isTable && obj.userData.status === 'reserved') {
            obj.userData.status = 'available';
            obj.material = obj.userData.originalMaterial;
            if (obj.userData.indicatorMesh) {
                obj.userData.indicatorMesh.material.color.setHex(0x44dd66);
                obj.userData.indicatorMesh.material.emissive.setHex(0x119933);
            }
            if (obj.userData.lightSource) obj.userData.lightSource.color.setHex(0x44dd66);
            const tg = obj.userData.tableGroup;
            if (tg) {
                const food = tg.getObjectByName('foodProp');
                if (food) tg.remove(food);
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', () => setTimeout(initBookingSystem, 100));
