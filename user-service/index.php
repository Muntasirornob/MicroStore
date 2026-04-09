<?php

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;
use App\Models\User;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Set up database connection
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => 'pgsql',
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'port' => $_ENV['DB_PORT'] ?? '5432',
    'database' => $_ENV['DB_DATABASE'] ?? 'userdb',
    'username' => $_ENV['DB_USERNAME'] ?? 'postgres',
    'password' => $_ENV['DB_PASSWORD'] ?? 'ontu123',
    'charset' => 'utf8',
    'prefix' => '',
    'schema' => 'public',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

// CORS headers
$allowedOrigins = explode(',', $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost:3000');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple router
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Get request body for POST requests
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// Logging function
function logInfo(string $message): void {
    $timestamp = date('Y-m-d H:i:s');
    error_log("[$timestamp] INFO: $message");
}

function logError(string $message): void {
    $timestamp = date('Y-m-d H:i:s');
    error_log("[$timestamp] ERROR: $message");
}

// Response helper
function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Initialize database schema if needed
function initializeDatabase(): void {
    try {
        Capsule::schema()->hasTable('users');
    } catch (\Exception $e) {
        // Table doesn't exist, create it
        Capsule::schema()->create('users', function ($table) {
            $table->increments('id');
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamps();
        });
        logInfo('Created users table');
    }

    // Seed if empty
    if (User::count() === 0) {
        User::create(['name' => 'John Doe', 'email' => 'john@example.com']);
        User::create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);
        logInfo('Seeded 2 users');
    }
}

// Routes
try {
    initializeDatabase();

    // Health check
    if ($uri === '/health' && $method === 'GET') {
        try {
            Capsule::connection()->getPdo();
            jsonResponse([
                'status' => 'healthy',
                'service' => 'user-service',
                'database' => 'connected'
            ]);
        } catch (\Exception $e) {
            logError('Database health check failed: ' . $e->getMessage());
            jsonResponse([
                'status' => 'unhealthy',
                'service' => 'user-service',
                'database' => 'disconnected'
            ], 503);
        }
    }

    // Get all users
    if ($uri === '/users' && $method === 'GET') {
        $users = User::all()->map(fn($u) => $u->toResponse())->toArray();
        logInfo('Retrieved ' . count($users) . ' users');
        jsonResponse($users);
    }

    // Get user by ID
    if (preg_match('/^\/users\/(\d+)$/', $uri, $matches) && $method === 'GET') {
        $id = (int) $matches[1];
        $user = User::find($id);

        if (!$user) {
            logInfo("User $id not found");
            jsonResponse(['error' => 'User not found'], 404);
        }

        logInfo("Retrieved user $id");
        jsonResponse($user->toResponse());
    }

    // Create user
    if ($uri === '/users' && $method === 'POST') {
        if (empty($body['name']) || empty($body['email'])) {
            jsonResponse(['error' => 'Name and email are required'], 400);
        }

        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Invalid email format'], 400);
        }

        if (User::where('email', $body['email'])->exists()) {
            jsonResponse(['error' => 'Email already exists'], 409);
        }

        $user = User::create([
            'name' => $body['name'],
            'email' => $body['email'],
        ]);

        logInfo("Created user: {$user->name}");
        jsonResponse($user->toResponse(), 201);
    }

    // Login
    if ($uri === '/login' && $method === 'POST') {
        if (empty($body['email'])) {
            jsonResponse(['error' => 'Email is required'], 400);
        }

        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Invalid email format'], 400);
        }

        $email = $body['email'];
        logInfo("Login attempt for email: $email");

        $user = User::where('email', $email)->first();

        if (!$user) {
            logInfo("User not found with email: $email");
            jsonResponse(['error' => 'User not found'], 404);
        }

        // Generate simple token
        $token = base64_encode($user->id . ':' . $user->email . ':' . bin2hex(random_bytes(16)));

        logInfo("User logged in successfully: {$user->id}");
        jsonResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'token' => $token,
        ]);
    }

    // 404 for unmatched routes
    jsonResponse(['error' => 'Endpoint not found'], 404);

} catch (\Exception $e) {
    logError('Server error: ' . $e->getMessage());
    jsonResponse(['error' => 'Internal server error'], 500);
}
