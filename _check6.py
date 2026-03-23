import asyncio
from pipeline import run_pipeline
events = []
async def test():
    async def callback(event):
        events.append(event)
        print(f'  Event: {event.get("event")} — {str(event.get("data",{}))[:60]}')
    await run_pipeline('NASA was founded in 1958', callback)
    status_events = [e for e in events if e.get('event') == 'status']
    verdict_events = [e for e in events if e.get('event') == 'verdict']
    claim_events = [e for e in events if e.get('event') == 'claim']
    print(f'PASS: Pipeline complete')
    print(f'  Status events: {len(status_events)}')
    print(f'  Claim events: {len(claim_events)}')
    print(f'  Verdict events: {len(verdict_events)}')
    stages = [e['data'].get('stage') for e in status_events]
    print(f'  Stages seen: {stages}')
    if 'complete' in stages:
        print(f'  Pipeline reached COMPLETE stage — PASS')
    else:
        print(f'  ERROR: Pipeline never reached complete stage')
asyncio.run(test())
