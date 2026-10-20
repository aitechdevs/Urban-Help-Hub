<?php
namespace App\Providers;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mime\Part\DataPart;
use Symfony\Component\Mime\Part\File;

class BrandedMailServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(MessageSending::class, function (MessageSending $event) {
            $message = $event->message;
            if ($message->getHeaders()->has('X-UrbanHelpHub-Branded')) return;
            $logo = resource_path('mail/urbanhelphub-logo.png');
            if (!is_file($logo)) return; // Branding must never block existing delivery.
            $part = (new DataPart(new File($logo), 'urbanhelphub-logo.png', 'image/png'))->asInline();
            $cid = $part->getContentId();
            $message->addPart($part);
            $header = '<div style="padding:24px;background:#ffffff;border-bottom:1px solid #e2e8f0"><a href="https://urbanhelphub.com/"><img src="cid:'.$cid.'" alt="UrbanHelpHub" width="220" style="display:block;width:220px;max-width:100%;height:auto;border:0"></a></div>';
            $html = $message->getHtmlBody();
            if (is_string($html) && $html !== '') {
                if (preg_match('/<body\b[^>]*>/i', $html)) {
                    $html = preg_replace_callback('/<body\b[^>]*>/i', fn ($match) => $match[0].$header, $html, 1);
                } else { $html = $header.$html; }
            } else {
                // Escape all message content. Only first-party HTTPS URLs become links.
                $text = (string) $message->getTextBody();
                $segments = preg_split('~(https://urbanhelphub\.com/[^\s<>"\x27]+)~', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
                $content = '';
                foreach ($segments as $index => $segment) {
                    $safe = htmlspecialchars($segment, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $content .= $index % 2 === 1 ? '<a href="'.$safe.'" style="color:#167d35;text-decoration:underline">'.$safe.'</a>' : nl2br($safe);
                }
                $html = '<!doctype html><html><body style="margin:0;background:#f7f9fc;font-family:Arial,sans-serif;color:#082f5b"><div style="max-width:620px;margin:24px auto;background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">'.$header.'<div style="padding:24px;font-size:15px;line-height:1.7;overflow-wrap:anywhere">'.$content.'</div></div></body></html>';
            }
            $message->html($html);
            $message->getHeaders()->addTextHeader('X-UrbanHelpHub-Branded', '1');
            // Original text body, recipient, subject, token and sending policy stay intact.
        });
    }
}
