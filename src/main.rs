use std::sync::Arc;
use tokio::sync::Semaphore;
use serde::Serialize;
use reqwest::Client;
use tokio::time::{sleep, Duration};

#[derive(Serialize)]
struct Notification {
    to: String,
    message: String,
}

async fn send_notification(to: &str, message: &str, client: Arc<Client>) -> Result<(), reqwest::Error> {
    let notification = Notification {
        to: to.to_string(),
        message: message.to_string(),
    };

    client.post("http://localhost:3000/send-notification")
        .json(&notification)
        .send()
        .await?;

    Ok(())
}

async fn check_client_ready(client: Arc<Client>) -> Result<(), reqwest::Error> {
    loop {
        let response = client.get("http://localhost:3000/ready").send().await;
        if let Ok(res) = response {
            if res.status().is_success() {
                break;
            }
        }
        sleep(Duration::from_secs(5)).await;
    }
    Ok(())
}

#[tokio::main]
async fn main() {
    let client = Arc::new(Client::new());
    let semaphore = Arc::new(Semaphore::new(200));
    let to_numbers = vec!["+5547992126662"]; 

    check_client_ready(Arc::clone(&client)).await.unwrap();

    let mut handles = vec![];

    for &to in to_numbers.iter() {
        let permit = Arc::clone(&semaphore).acquire_owned().await.unwrap();
        let client = Arc::clone(&client);

        let handle = tokio::spawn(async move {
            send_notification(to, "Your notification message", client).await.unwrap();
            drop(permit);
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.await.unwrap();
    }
}
