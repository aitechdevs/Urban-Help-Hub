<?php

namespace App\Http\Controllers;

use App\Support\InAppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function unreadCount(Request $request): JsonResponse
    {
        $count = DB::table('messages')->where('recipient_id', $request->user()->id)->whereNull('read_at')->count();
        return response()->json(['success' => true, 'data' => ['unread_count' => $count]]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tasks = DB::table('tasks')
            ->join('task_assignments', 'tasks.id', '=', 'task_assignments.task_id')
            ->join('users as customers', 'tasks.customer_id', '=', 'customers.id')
            ->join('users as helpers', 'task_assignments.helper_id', '=', 'helpers.id')
            ->whereIn('task_assignments.status', ['confirmed','in_progress','awaiting_completion','completed'])
            ->where(fn ($q) => $q->where('tasks.customer_id', $user->id)->orWhere('task_assignments.helper_id', $user->id))
            ->select('tasks.id as task_id','tasks.title','customers.id as customer_id','customers.name as customer_name','helpers.id as helper_id','helpers.name as helper_name')
            ->orderByDesc('tasks.updated_at')->get();

        foreach ($tasks as $task) {
            $task->messages = DB::table('messages')->where('task_id', $task->task_id)
                ->join('users as senders', 'messages.sender_id', '=', 'senders.id')
                ->select('messages.id','messages.sender_id','senders.name as sender_name','messages.message','messages.created_at')
                ->orderBy('messages.created_at')->get();
            DB::table('messages')->where('task_id', $task->task_id)->where('recipient_id', $user->id)->whereNull('read_at')->update(['read_at' => now()]);
        }
        return response()->json(['success' => true, 'data' => $tasks]);
    }

    public function store(Request $request, int $taskId): JsonResponse
    {
        $validated = $request->validate(['message' => ['required','string','max:2000']]);
        $user = $request->user();
        $party = DB::table('tasks')->join('task_assignments','tasks.id','=','task_assignments.task_id')
            ->where('tasks.id',$taskId)->whereIn('task_assignments.status',['confirmed','in_progress','awaiting_completion','completed'])
            ->select('tasks.customer_id','tasks.title','task_assignments.helper_id')->first();
        if (!$party || !in_array((int)$user->id, [(int)$party->customer_id,(int)$party->helper_id], true))
            return response()->json(['success'=>false,'message'=>'This conversation is not available.'],403);
        $recipient = (int)$user->id === (int)$party->customer_id ? (int)$party->helper_id : (int)$party->customer_id;
        DB::table('messages')->insert(['task_id'=>$taskId,'sender_id'=>$user->id,'recipient_id'=>$recipient,'message'=>$validated['message'],'is_system_message'=>false,'created_at'=>now(),'updated_at'=>now()]);
        InAppNotification::send($recipient,'new_message','New message from '.$user->name,$validated['message'],$user->role === 'customer' ? '/helper/messages' : '/messages',['task_id'=>$taskId]);
        return response()->json(['success'=>true,'message'=>'Message sent.'],201);
    }
}
