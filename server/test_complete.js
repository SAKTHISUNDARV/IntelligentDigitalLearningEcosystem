const update = async () => {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'student@idle.dev', password: 'Admin@1234' })
        });
        const { token } = await loginRes.json();
        console.log("Logged in");
        
        const patchRes = await fetch('http://localhost:5000/api/courses/1/progress', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ progress: 100 })
        });
        console.log(await patchRes.json());
    } catch(e) {
        console.error(e);
    }
}
update();
