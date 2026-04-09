<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * Health check endpoint
     */
    public function health(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            return response()->json([
                'status' => 'healthy',
                'service' => 'user-service',
                'database' => 'connected'
            ]);
        } catch (\Exception $e) {
            Log::error('Database health check failed: ' . $e->getMessage());
            return response()->json([
                'status' => 'unhealthy',
                'service' => 'user-service',
                'database' => 'disconnected'
            ], 503);
        }
    }

    /**
     * Get all users
     */
    public function index(): JsonResponse
    {
        try {
            $users = User::all();
            Log::info('Retrieved ' . count($users) . ' users');
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch users'], 500);
        }
    }

    /**
     * Get user by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                Log::warning("User {$id} not found");
                return response()->json(['error' => 'User not found'], 404);
            }

            Log::info("Retrieved user {$id}");
            return response()->json($user);
        } catch (\Exception $e) {
            Log::error("Error fetching user {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch user'], 500);
        }
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            $user = User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
            ]);

            Log::info("Created user: {$user->name}");
            return response()->json($user, 201);
        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create user'], 500);
        }
    }

    /**
     * Login endpoint
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            $email = $request->input('email');
            Log::info("Login attempt for email: {$email}");

            $user = User::where('email', $email)->first();

            if (!$user) {
                Log::warning("User not found with email: {$email}");
                return response()->json(['error' => 'User not found'], 404);
            }

            // Generate a simple token (in production, use proper JWT)
            $token = base64_encode($user->id . ':' . $user->email . ':' . Str::uuid());

            Log::info("User logged in successfully: {$user->id}");

            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'token' => $token,
            ]);
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return response()->json(['error' => 'Login failed'], 500);
        }
    }
}
