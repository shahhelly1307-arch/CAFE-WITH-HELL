/**
 * Improved human figures — natural proportions, faces, clothing.
 */

function createRealisticPerson(options = {}) {
    const {
        skinColor = 0xe8b896,
        shirtColor = 0x2d5a3d,
        pantsColor = 0x3d3d4a,
        hairColor = 0x2a1810,
        apron = false,
        scale = 1.0
    } = options;

    const person = new THREE.Group();
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'bodyGroup';

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.58, metalness: 0.02 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.86 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.88 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.92 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.65 });

    // Upper body — box for more natural shoulders
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.22), shirtMat);
    chest.position.y = 1.12;
    chest.castShadow = true;
    bodyGroup.add(chest);

    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.2), pantsMat);
    hips.position.y = 0.72;
    hips.castShadow = true;
    bodyGroup.add(hips);

    if (apron) {
        const apronMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.5, 0.05),
            new THREE.MeshStandardMaterial({ color: 0xf8f4ee, roughness: 0.9 })
        );
        apronMesh.position.set(0, 0.98, 0.13);
        bodyGroup.add(apronMesh);
    }

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8), skinMat);
    neck.position.y = 1.42;
    bodyGroup.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
    head.scale.set(0.95, 1.1, 0.92);
    head.position.y = 1.58;
    head.castShadow = true;
    bodyGroup.add(head);

    const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.145, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
        hairMat
    );
    hair.position.y = 1.64;
    hair.rotation.x = -0.08;
    bodyGroup.add(hair);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), skinMat);
    nose.position.set(0, 1.56, 0.13);
    bodyGroup.add(nose);

    [-0.04, 0.04].forEach(x => {
        const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        eyeW.position.set(x, 1.6, 0.12);
        bodyGroup.add(eyeW);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
        pupil.position.set(x, 1.6, 0.132);
        bodyGroup.add(pupil);
    });

    function makeLimb(name, upperMat, lowerMat, upperLen, lowerLen, x, y, thick = 0.055) {
        const joint = new THREE.Group();
        joint.name = name;
        joint.position.set(x, y, 0);
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick * 0.92, upperLen, 10), upperMat);
        upper.position.y = -upperLen / 2;
        upper.castShadow = true;
        joint.add(upper);
        const elbow = new THREE.Group();
        elbow.position.y = -upperLen;
        elbow.name = name + 'Lower';
        const lower = new THREE.Mesh(new THREE.CylinderGeometry(thick * 0.88, thick * 0.78, lowerLen, 10), lowerMat);
        lower.position.y = -lowerLen / 2;
        lower.castShadow = true;
        elbow.add(lower);
        joint.add(elbow);
        return joint;
    }

    bodyGroup.add(
        makeLimb('leftShoulder', shirtMat, skinMat, 0.3, 0.28, -0.24, 1.32),
        makeLimb('rightShoulder', shirtMat, skinMat, 0.3, 0.28, 0.24, 1.32),
        makeLimb('leftHip', pantsMat, pantsMat, 0.44, 0.42, -0.1, 0.62, 0.065),
        makeLimb('rightHip', pantsMat, pantsMat, 0.44, 0.42, 0.1, 0.62, 0.065)
    );

    [-0.1, 0.1].forEach(x => {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.065, 0.16), shoeMat);
        shoe.position.set(x, 0.032, 0.04);
        shoe.castShadow = true;
        bodyGroup.add(shoe);
    });

    person.add(bodyGroup);
    person.scale.setScalar(scale);
    return person;
}

function poseStandingBarista(person) {
    const lSh = person.getObjectByName('leftShoulder');
    const rSh = person.getObjectByName('rightShoulder');
    if (lSh) lSh.rotation.set(-1.0, 0.2, 0.25);
    if (rSh) rSh.rotation.set(-0.85, -0.25, -0.1);
}

function poseSeated(person, mug = true) {
    const body = person.getObjectByName('bodyGroup');
    if (body) body.position.y = 0.38;
    ['leftHip', 'rightHip'].forEach(n => {
        const hip = person.getObjectByName(n);
        if (hip) hip.rotation.set(-Math.PI / 2.15, 0, 0);
        const shin = person.getObjectByName(n + 'Lower');
        if (shin) shin.rotation.set(Math.PI / 2.05, 0, 0);
    });
    const lSh = person.getObjectByName('leftShoulder');
    const rSh = person.getObjectByName('rightShoulder');
    if (lSh) lSh.rotation.set(-0.55, 0.15, 0.35);
    if (rSh) rSh.rotation.set(-0.45, -0.1, -0.25);
    if (mug) {
        const mugMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.032, 0.065, 10),
            new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.35 })
        );
        mugMesh.position.set(0.12, 0.72, 0.22);
        person.add(mugMesh);
    }
}

window.createRealisticPerson = createRealisticPerson;
window.poseStandingBarista = poseStandingBarista;
window.poseSeated = poseSeated;
