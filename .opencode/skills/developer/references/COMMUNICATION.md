# Communication Guide for Developers

## When to Stop and Communicate

### Critical Situation Indicators

Stop development and communicate when you encounter:

#### 1. Scope Explosion
- **Sign**: Task affects more than 5 files unexpectedly
- **Action**: Pause and explain the scope change
- **Template**: 
  ```
  I expected to modify [X files] but now need to touch [Y files].
  This is because [reason].
  Should I proceed with the expanded scope, or should we break this into smaller tasks?
  ```

#### 2. Architecture Impact
- **Sign**: Need to modify core architecture or public APIs
- **Action**: Propose the change before implementing
- **Template**:
  ```
  To implement [feature], I need to change [architecture component].
  This affects [downstream impacts].
  
  Options:
  1. [Approach A] - [trade-offs]
  2. [Approach B] - [trade-offs]
  
  Recommendation: [option] because [reasoning]
  ```

#### 3. Estimate Blowout
- **Sign**: Effort exceeds 2x original estimate
- **Action**: Report immediately with options
- **Template**:
  ```
  Original estimate: [X time]
  Current projection: [Y time] (2x+ over)
  
  Reasons for increase:
  - [Unexpected complexity]
  - [Discovered dependency]
  
  Options:
  1. Continue with full implementation ([Y time])
  2. Implement minimal viable version ([Z time])
  3. Defer to later sprint
  ```

#### 4. Security Implications
- **Sign**: Change affects authentication, authorization, or data security
- **Action**: Stop and flag for security review
- **Template**:
  ```
  SECURITY REVIEW NEEDED
  
  The change to [component] affects:
  - [Security concern 1]
  - [Security concern 2]
  
  Mitigations considered:
  - [Mitigation 1]
  - [Mitigation 2]
  
  Please review before proceeding.
  ```

#### 5. Breaking Changes
- **Sign**: Change breaks backward compatibility
- **Action**: Propose migration strategy
- **Template**:
  ```
  This change breaks backward compatibility for [API/component].
  
  Migration options:
  1. [Option with migration path]
  2. [Option with deprecation period]
  3. [Option with version bump]
  
  Recommendation: [option]
  ```

#### 6. Uncertainty After Research
- **Sign**: Still unsure of correct approach after investigation
- **Action**: Present findings and ask for guidance
- **Template**:
  ```
  I've researched [problem] and found multiple valid approaches:
  
  1. [Approach A] - [pros/cons]
  2. [Approach B] - [pros/cons]
  3. [Approach C] - [pros/cons]
  
  I'm uncertain which fits our long-term direction.
  Which approach would you prefer?
  ```

## Communication Best Practices

### Be Specific

**Bad**:
> "There's a problem with the database."

**Good**:
> "The user creation fails because the unique constraint on 'email' conflicts with soft-deleted users. We need to either:
> 1. Include 'deleted_at IS NULL' in the unique index
> 2. Hard-delete users instead of soft-delete
> 3. Use a composite unique key (email + deleted_at)"

### Provide Context

Always include:
- What you were trying to do
- What you expected to happen
- What actually happened
- What you've already tried

### Propose Solutions

Don't just report problems—suggest fixes:

**Bad**:
> "The build is broken."

**Good**:
> "The build fails because of a missing dependency. I can:
> 1. Add the missing package to package.json
> 2. Remove the import if it's unused
> 
> I recommend option 1 because the package is needed for the new feature."

### Use the Right Channel

- **Immediate blockers**: Direct message or call
- **Architecture decisions**: Team discussion or design doc
- **Code review issues**: PR comments
- **General questions**: Team chat or standup

## Escalation Path

1. **Try to resolve** (5-10 minutes of research)
2. **Communicate the issue** (use templates above)
3. **Wait for response** (if urgent, say so)
4. **Proceed with guidance** or **escalate further** if needed

## Remember

> "Bad news early is good news. Bad news late is a disaster."

> "It's better to over-communicate than to surprise your team with a problem at the deadline."

> "When in doubt, reach out."
