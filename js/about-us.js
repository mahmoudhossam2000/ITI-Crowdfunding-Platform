document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('feedbackForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        const feedback = {
            name,
            email,
            message
        };

        fetch('http://localhost:3000/feedbacks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedback)
        })
            .then(() => {
                document.getElementById('successMessage').classList.remove('d-none');
                document.getElementById('feedbackForm').reset();
            })
            .catch(err => {
                alert('Failed to send feedback. Please try again later.');
                console.error(err);
            });
    });
})